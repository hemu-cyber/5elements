# LinkPulse — Architectural & Implementation Decisions

This log tracks every design decision, assumption, and implementation choice across LinkPulse development.

---

## Initial Decisions (Phase 0)

### DEC-001: Project Directory & Workspace Layout
- **Decision**: Code is housed in `C:\Users\Hemra\.gemini\antigravity\scratch\linkpulse`.
- **Reason**: Standard antigravity workspace policy for uninitialized environments.

### DEC-002: Base Styling & Tailwind CSS Token Configuration
- **Decision**: Configure Tailwind v3 with CSS variables mapped to the design system color specifications:
  - `ink`: `#14181F`
  - `ink-soft`: `#2B323C`
  - `muted`: `#64707D`
  - `border`: `#E4E9EE`
  - `canvas`: `#F5F7FA`
  - `surface`: `#FFFFFF`
  - `brand`: `#0AA5E8`
  - `brand-tint`: `#E6F6FD`
  - `signal`: `#FF7A1A`
  - `success`: `#12A150`
  - `warning`: `#E39B00`
  - `danger`: `#E5484D`
- **Reason**: Guarantees strict adherence to the design brief without accidental palette drift.

### DEC-003: Headless Chrome Screenshot Verification
- **Decision**: Use the pre-installed Google Chrome binary at `C:\Program Files\Google\Chrome\Application\chrome.exe` in headless mode (`--headless=new --screenshot=... --window-size=1440,900` and `--window-size=390,844`) to capture exact visual regression screenshots for 1440px and 390px responsive checks.
- **Reason**: Instant execution, native zero-overhead browser rendering without waiting on Playwright binary downloads.

### DEC-004: Supabase Client Architecture
- **Decision**:
  - Client side: Shared Supabase browser client initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  - Server functions / Edge functions: Server client initialized with `SUPABASE_SERVICE_ROLE_KEY` to perform administrative queries, atomic click increments, and bypass RLS where appropriate (e.g. public link resolution and logging).
- **Reason**: Adheres to the security perimeter specified in the brief.

### DEC-005: Local Development & Fallbacks for Supabase
- **Decision**: Provide both direct Supabase connection capabilities via environment variables and robust local fallback / mock storage mode when Supabase credentials are empty during development and test rendering, ensuring tests and previews never crash or stall.
- **Reason**: Enables continuous headless verification and local development reliability.

### DEC-006: Edge Function Path & SPA Routing
- **Decision**: Short links are routed via `/r/:code`. In `netlify.toml`, the edge function is bound to `/r/*`. The SPA fallback rewrite `/* /index.html 200` is placed last so edge functions and Netlify functions (`/.netlify/*`) are never blocked.
- **Reason**: Required redirect pipeline behavior.

### DEC-007: Automated Screenshot Pipeline
- **Decision**: Implemented `scripts/screenshot.mjs` using `puppeteer-core` driving the local Chrome binary at `C:\Program Files\Google\Chrome\Application\chrome.exe` to capture 1440px (desktop) and 390px (mobile) screenshots.
- **Reason**: Provides deterministic, reproducible visual regression testing across all phases with zero download overhead.

### DEC-008: Desktop Project Export Target
- **Decision**: User requested to export and save the LinkPulse project to `C:\Users\Hemra\Desktop\gehulink`.
- **Reason**: Explicit user preference to keep existing Desktop folders separate and organize the workspace under `gehulink`.
