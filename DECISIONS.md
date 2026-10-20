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

### DEC-004: Firebase Authentication and Supabase Data Schema
- **Decision**:
  - Client-side authentication: Firebase Authentication email/password with verification links, initialized from the public Firebase Web App configuration variables.
  - Supabase migrations are retained as a future database schema; Firebase ID tokens are not Supabase Auth sessions and do not satisfy Supabase RLS policies.
- **Reason**: The app uses Firebase Auth for verified user identity while avoiding any client-exposed administrator credentials.

### DEC-005: Local Development & Fallbacks for Firebase
- **Decision**: When Firebase Web App configuration is absent, retain the browser-local demo mode so local previews remain usable without a Firebase project.
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
