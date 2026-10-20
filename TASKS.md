# LinkPulse — Master Implementation Plan (TASKS.md)

## PHASE 0 - Foundation
- [x] Scaffold Vite React TS app, install the stack, configure Tailwind with the design tokens, self-hosted fonts, themed shadcn components
- [x] App shell: sidebar (Dashboard, Links, Campaigns, QR Codes, Analytics, Admin, Settings), topbar, route guards, 404
- [x] netlify.toml, .env.example, README skeleton
- [x] Supabase migration: all tables, indexes, RLS policies, RPC functions and analytics views

## PHASE 1 - Auth, roles, seed data
- [ ] Email/password auth, profiles trigger, user/admin guards
- [ ] Landing page, login, signup, "Try the demo" one-click demo login
- [ ] Seed script (npm run seed): demo admin + demo user, 3 campaigns, 8 tags, ~30 links in varied states (active, expired, disabled, password-protected, click-limited), ~4000 clicks over 30 days with realistic patterns (weekday peaks, mobile majority, varied referrers and countries, ~8% bots)

## PHASE 2 - Link management
- [ ] Create-link wizard. Step 1: destination URL + alias (auto-generate or custom, live debounced availability check, instant URL validation). Step 2: campaign, tags, expiry, click limit, password, UTM builder (auto-fills utm_campaign from campaign), review of validation warnings, then publish
- [ ] Create/update functions with server-side validation and rate limiting
- [ ] Links list: search, filters (status, campaign, tag), sort, pagination, row actions (copy, edit, QR, disable/enable, delete)
- [ ] Link detail page with tabs
- [ ] Campaigns CRUD and detail (total links, clicks, top links); tags CRUD

## PHASE 3 - Redirect engine and click tracking (CORE MVP, deploy after this phase)
- [ ] Edge function implementing the exact rule order
- [ ] Branded status pages for every failure reason
- [ ] Password unlock page and endpoint
- [ ] Async click logging, bot filtering, UA parsing (device, OS, browser), geo, source detection, visitor hash
- [ ] Deploy to Netlify, smoke-test the live URL: create link -> open -> click appears

## PHASE 4 - Analytics
- [ ] Link analytics: clicks over time, unique visitors, sources, devices, browsers, countries, recent clicks, date range (7d/30d/90d/custom), bots toggle
- [ ] Dashboard: KPI cards with change vs previous period, clicks trend, campaign performance table, top 5 links, link alerts (expiring in 7 days, near click limit, disabled, traffic spike), live "pulse" feed that refreshes every 5s
- [ ] Admin platform-wide analytics
- [ ] Export analytics to CSV

## PHASE 5 - QR codes, bulk import, admin
- [ ] QR generation (qrcode lib), colour and size options, PNG and SVG download, scan tracking, QR Codes page
- [ ] Bulk import: CSV upload + template download, per-row validation (URL, alias, duplicates in file and database, blocklisted domains), preview table with error badges, import valid rows only, result summary
- [ ] Admin: all-links table, disable link with reason (instant effect), domain blocklist CRUD, users list with role change, audit log

## PHASE 6 - Advanced and polish
- [ ] Device targeting (iOS/Android destinations) in wizard, rules tab and redirect engine
- [ ] Link-in-bio page builder at /b/:slug using the user's links
- [ ] "Simulate traffic" demo tool (Settings, admin and demo user) that generates realistic clicks through the real tracking pipeline
- [ ] Dark mode toggle, Ctrl+K command palette
- [ ] Skeletons, empty states, error boundaries, toasts, responsive and accessibility pass

## PHASE 7 - Ship
- [ ] README: overview, architecture diagram (mermaid), data model, redirect rule order, env vars, local setup, Netlify deploy steps
- [ ] DEMO_SCRIPT.md: 5-minute walkthrough of two scenarios (A: create link -> open it -> see analytics; B: bulk import -> admin disables a link -> redirect stops -> its analytics remain)
- [ ] ROADMAP.md: custom domains, public API, workspaces and folders, A/B destinations, webhooks, Safe Browsing integration
- [ ] Final QA: verify all 8 steps of the "Complete Flow" end to end on the live site, run Lighthouse, fix issues, production deploy
