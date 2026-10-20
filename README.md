# LinkPulse

LinkPulse is a high-performance URL shortener, link management platform, and analytics engine built for modern product teams, growth marketers, and developers.

## Features
- **Deterministic Redirection Engine**: Executes strict 8-step rule ordering (not found, disabled, blocklisted, expired, click limits, password protection, device targeting, and 302 redirection).
- **Click Analytics**: Timeseries, traffic-source and geography summaries are computed from recorded clicks and refresh every five seconds. No synthetic analytics are shown.
- **Enterprise Controls**: Global domain blocklist, instant administrative killswitches, audit logs, and rate limiting.
- **Clean Aesthetic**: Built strictly to a calibrated, dense, calm, and distraction-free design system (Linear / Dub.co inspired).

## Architecture Overview
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + TanStack Query + Recharts
- **API**: Netlify Functions (`netlify/functions`)
- **Redirects**: Netlify Edge Functions (`netlify/edge-functions`)
- **Database & Auth**: Supabase Postgres with Row Level Security (RLS) and atomic SQL RPC functions.

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Supabase account (or local Supabase instance)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/linkpulse.git
cd linkpulse

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Update .env.local with your Supabase credentials
```

### Running Locally
```bash
# Start frontend development server
npm run dev

# Or run with Netlify CLI to test Functions and Edge Functions
npx netlify dev
```

### Supabase email verification and first admin

Email/password sign-up and sign-in require a Supabase project. Without Supabase credentials, only the browser-local demo accounts are available; these are not real email accounts and must not be used for production.

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, enable email confirmations.
3. In **Authentication → URL Configuration**, set the Site URL to your app URL and add the local and deployed app URLs to the redirect allow list (for example, `http://localhost:5173/**` and `https://your-site.netlify.app/**`).
4. In **Authentication → Email Templates → Confirm signup**, update the template to display Supabase's six-digit token using `{{ .Token }}`. For example:

   ```html
   <h2>Confirm your LinkPulse account</h2>
   <p>Enter this code in the sign-up screen to verify your email:</p>
   <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">{{ .Token }}</p>
   <p>This code expires. If you did not request it, you can ignore this email.</p>
   ```

   Save the template. The sign-up screen accepts this six-digit code and verifies it with Supabase; the default confirmation-link template does not provide the code-entry flow.
5. In **SQL Editor**, execute the files in `supabase/migrations/` in filename order. The role-hardening migration prevents users from assigning themselves admin privileges.
6. In VS Code, copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**, then restart `npm run dev`. The anon key is intended for the browser; never put a service-role key in a `VITE_` variable or frontend code.
7. Sign up with the admin email you want to use and enter the code from its confirmation email. Then in Supabase **SQL Editor**, promote that confirmed account using the database owner connection:

   ```sql
   BEGIN;
   ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_role;
   UPDATE public.profiles
   SET role = 'admin'
   WHERE lower(email) = lower('Admin123@gmail.com');
   ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_role;
   COMMIT;
   ```

   Run this only in the Supabase SQL Editor after confirming that the email exists in `public.profiles`. Use a strong, private password in Supabase; do not store passwords in this repository or reuse a demo password in production. Sign in again after promotion to load the new role.
8. For deployed email delivery, configure a trusted SMTP provider under the Supabase project's authentication/email settings. The built-in email service is intended for testing and may only deliver to authorized addresses.

### Data and analytics scope

Links, campaigns, clicks, and moderation data are currently stored in the browser's local storage, even when Supabase authentication is enabled. Analytics now uses recorded redirect events from that browser and refreshes every five seconds; it does not use seeded traffic or invented location data. It is not yet shared across devices or users. Supabase-backed link persistence and server-side click ingestion must be connected before deploying this as a shared production analytics service.

## License
MIT
