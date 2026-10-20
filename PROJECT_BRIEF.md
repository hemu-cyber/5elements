# LinkPulse — Project Brief

## Product Overview
LinkPulse is an integrated link management, redirection, and analytics platform built for modern product teams, growth engineers, and creators. It delivers real-time link tracking, deep analytics, link rules enforcement, and administrative governance deployed on Netlify with Supabase.

### Link Lifecycle
`create` -> `share` (short URL or QR) -> `redirect` (rules enforced) -> `track` -> `analyse` -> `expire or disable`
- Expired or disabled links preserve their complete historical analytics.
- "Expired" is computed dynamically from `expires_at` rather than stored statically, ensuring data consistency over time.

---

## User Roles & Permissions
1. **Visitor (Anonymous)**:
   - Resolves and traverses short links (`/r/:code`).
   - Enters link passwords on unlock page if protected.
   - Zero access to management interfaces, APIs, or underlying metrics.
2. **User (Authenticated Creator/Marketer)**:
   - Manages personal links, campaigns, tags, and custom QR codes.
   - Accesses detailed analytics strictly scoped to owned links (enforced via Row Level Security).
   - Generates UTM parameters, configures device targeting (iOS/Android), sets expiry and click caps.
3. **Admin (Platform Operator)**:
   - Comprehensive observability across all system links, campaigns, clicks, and users.
   - Immediate killswitch: disables abusive or malicious links, instantaneously halting redirection.
   - Manages platform domain blocklist and user roles.
   - Accesses audit logs and platform-wide aggregations.

---

## Technical Stack
- **Frontend**: Vite 5+ with React 18, TypeScript (strict mode enabled), Tailwind CSS v3, Radix UI / shadcn/ui components, React Router v6, TanStack Query (React Query v5), Recharts, lucide-react, Zod (isomorphic validation schemas shared across client and server).
- **Self-Hosted Typography**: Inter (UI), Montserrat (Headings), JetBrains Mono (Code/URLs) via `@fontsource`.
- **API Functions**: Netlify Functions (TypeScript) located in `netlify/functions`.
- **Redirect Engine**: Netlify Edge Functions on path `/r/*` in `netlify/edge-functions`. Employs `context.waitUntil()` for non-blocking asynchronous click logging and `context.geo` for zero-latency geo-location detection (country, city). Short URL format: `https://<site>/r/<code>`.
- **Database & Auth**: Supabase Postgres with Email/Password auth, Row Level Security (RLS) policies, and atomic SQL RPC functions.
  - Server-side functions execute with the Supabase `service-role` secret key.
  - Client-side browser bundles interact strictly via the Supabase `anon` public key.
- **Hosting & Configuration**: `netlify.toml` with publish directory `dist`, SPA fallback rewrite `/* /index.html 200` positioned carefully after edge function routes (`/r/*`) and serverless routes (`/.netlify/*`), enterprise security headers, and `SECRETS_SCAN_OMIT_KEYS`.

---

## Data Model (PostgreSQL / Supabase)

### Tables
1. **`profiles`**
   - `id`: `uuid primary key references auth.users(id) on delete cascade`
   - `email`: `text not null`
   - `role`: `text not null check (role in ('user', 'admin')) default 'user'`
   - `created_at`: `timestamptz not null default now()`

2. **`campaigns`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `user_id`: `uuid not null references profiles(id) on delete cascade`
   - `name`: `text not null`
   - `description`: `text`
   - `color`: `text not null default '#0AA5E8'`
   - `starts_at`: `timestamptz`
   - `ends_at`: `timestamptz`
   - `created_at`: `timestamptz not null default now()`

3. **`tags`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `user_id`: `uuid not null references profiles(id) on delete cascade`
   - `name`: `text not null`
   - *Constraint*: `unique(user_id, name)`

4. **`links`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `user_id`: `uuid not null references profiles(id) on delete cascade`
   - `campaign_id`: `uuid references campaigns(id) on delete set null`
   - `code`: `text not null unique` (case-insensitive indexing)
   - `destination_url`: `text not null`
   - `title`: `text not null`
   - `status`: `text not null check (status in ('active', 'disabled')) default 'active'`
   - `disabled_reason`: `text`
   - `disabled_by`: `uuid references profiles(id)`
   - `password_hash`: `text` (null if unprotected, PBKDF2 Web Crypto format)
   - `expires_at`: `timestamptz`
   - `click_limit`: `integer`
   - `click_count`: `integer not null default 0`
   - `ios_url`: `text`
   - `android_url`: `text`
   - `created_at`: `timestamptz not null default now()`

5. **`link_tags`**
   - `link_id`: `uuid not null references links(id) on delete cascade`
   - `tag_id`: `uuid not null references tags(id) on delete cascade`
   - *Constraint*: `primary key (link_id, tag_id)`

6. **`clicks`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `link_id`: `uuid not null references links(id) on delete cascade`
   - `clicked_at`: `timestamptz not null default now()`
   - `referrer`: `text`
   - `source`: `text not null default 'direct'`
   - `device`: `text not null default 'desktop'` (desktop, mobile, tablet, other)
   - `os`: `text`
   - `browser`: `text`
   - `country`: `text` (ISO 2-letter or 'Unknown')
   - `city`: `text`
   - `visitor_hash`: `text not null`
   - `is_bot`: `boolean not null default false`

7. **`domain_blocklist`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `domain`: `text not null unique` (normalized lower-case domain)
   - `reason`: `text not null`
   - `added_by`: `uuid references profiles(id)`
   - `created_at`: `timestamptz not null default now()`

8. **`audit_log`**
   - `id`: `uuid primary key default gen_random_uuid()`
   - `actor_id`: `uuid references profiles(id) on delete set null`
   - `action`: `text not null` (e.g., 'link.disable', 'domain.block', 'user.role_change')
   - `target_type`: `text not null`
   - `target_id`: `text not null`
   - `meta`: `jsonb not null default '{}'::jsonb`
   - `created_at`: `timestamptz not null default now()`

### Performance Indexes
- `CREATE UNIQUE INDEX idx_links_code_lower ON links (lower(code));`
- `CREATE INDEX idx_clicks_link_id_clicked_at ON clicks (link_id, clicked_at DESC);`
- `CREATE INDEX idx_clicks_clicked_at ON clicks (clicked_at DESC);`
- `CREATE INDEX idx_links_user_id ON links (user_id);`
- `CREATE INDEX idx_campaigns_user_id ON campaigns (user_id);`

### SQL RPC & Atomic Operations
- `increment_click_atomic(p_link_id UUID)`: Atomically checks `click_limit IS NULL OR click_count < click_limit`. If eligible, increments `click_count = click_count + 1` and returns `TRUE`; otherwise returns `FALSE`. Prevents concurrency race conditions.

---

## Core Business Rules & Execution Flows

### 1. Code Generation & Aliases
- **Auto-generated**: 7-character base62 string generated via Web Crypto API `crypto.getRandomValues`. Collisions trigger automatic re-roll (up to 5 attempts).
- **Custom alias**: 3 to 30 characters, conforming to regex `^[a-zA-Z0-9_-]+$`, case-insensitive unique check.
- **Reserved slugs**: `login`, `signup`, `admin`, `api`, `r`, `dashboard`, `links`, `campaigns`, `tags`, `qr`, `analytics`, `import`, `settings`, `b`, `unlock`, `auth`, `public`, `assets`, `health`.

### 2. URL Validation
- Must parse as valid URL with protocol `http:` or `https:`.
- Self-referencing loop prevention: hostname cannot match the LinkPulse host.
- Domain blocklist validation: checks normalized host against `domain_blocklist`.
- Executed on client side for instantaneous feedback and validated authoritatively on the server.

### 3. Redirect Rule Evaluation Order (Strict, Non-Negotiable)
When a request arrives at `/r/:code`:
1. **Link Not Found**: If no record matches `lower(code)`, serve branded `404 Not Found` page.
2. **Status Disabled**: If `status == 'disabled'`, serve branded `Link Disabled` page (displays reason if public or standard admin notice).
3. **Destination Domain Blocklisted**: If domain is present in `domain_blocklist`, serve branded `Domain Blocked` page.
4. **Expired**: If `expires_at IS NOT NULL` and `now() > expires_at`, serve branded `Link Expired` page.
5. **Click Limit Reached**: If `click_limit IS NOT NULL` and `click_count >= click_limit`, serve branded `Click Limit Reached` page.
6. **Password Required**: If `password_hash IS NOT NULL` and signed unlock cookie `lp_unlocked_<code_hash>` is missing/invalid, redirect visitor to `/unlock/:code`.
7. **Device Targeting Override**: Check incoming `User-Agent`. If iOS and `ios_url` configured -> target = `ios_url`. If Android and `android_url` configured -> target = `android_url`. Otherwise -> target = `destination_url`.
8. **Log Click & Redirect**: Execute atomic counter increment, schedule asynchronous click tracking via `context.waitUntil()`, and return HTTP `302 Found` with `Location: target`.

### 4. Click Tracking & Visitor Intelligence
- **Asynchronous Execution**: Click ingestion is queued with `context.waitUntil()` without blocking redirection response.
- **Bot Detection**: Match User-Agent against crawler/spider signatures (`Googlebot`, `bingbot`, `Twitterbot`, `facebookexternalhit`, `HeadlessChrome`, `python-requests`, etc.).
  - When detected, record click with `is_bot = true`.
  - Bot hits **do not** consume click limits and are excluded from default analytics views.
- **Visitor Hash**: `SHA-256(client_ip + user_agent + SECRET_SALT)`. Preserves GDPR compliance while enabling accurate unique visitor calculations.
- **Source Classification**:
  - `?s=qr` or `?utm_source=qr` -> `qr`
  - Referrer domain matching: Google -> `google`, Facebook -> `facebook`, Instagram -> `instagram`, X/Twitter -> `x`, LinkedIn -> `linkedin`, WhatsApp -> `whatsapp`, Mail clients -> `email`.
  - Empty referrer -> `direct`.
  - Other unrecognized -> `other`.

### 5. Password Security & Unlocking
- Password derivation via PBKDF2 (SHA-256, 100,000 iterations, 16-byte random salt, Web Crypto API).
- Verification endpoint issues an HttpOnly, Secure, SameSite=Lax signed cookie valid for 10 minutes.
- Subsequent visit with cookie passes Rule 6 and triggers normal atomic redirect and click logging.

### 6. Rate Limiting & Safety
- User link creation rate limit: 10 links per minute per user account.
- Bulk CSV import cap: 500 records per upload batch with strict schema validation.
- Short-term Edge caching headers: max 5s cache-control TTL to guarantee admin disable actions take effect immediately across global edge nodes.
