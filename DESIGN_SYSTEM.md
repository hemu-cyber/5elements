# LinkPulse — Design System

## Philosophy & Aesthetic
- **Character**: Clean, dense, calm, trustworthy, high-utility SaaS (inspired by Linear, Vercel, Dub.co).
- **Discipline**: Never colourful for decoration, no AI templates, no gradient text, no glassmorphism, no neon glows, no decorative blobs.
- **Surface**: Flat surfaces with crisp 1px borders and subtle micro-shadows (`0 1px 2px rgba(20,24,31,.06)`).
- **Motion**: Instantaneous or snappy transitions (150ms ease-out).

---

## Colour System

Use **ONLY** the designated tokens. Strict prohibition against purple, indigo, violet, pink, or rainbow gradients.

### Core Neutral Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `ink` | `#14181F` | Dark sidebar, primary headings, primary buttons, active text |
| `ink-soft` | `#2B323C` | Secondary headings, subtle dark icons, sub-elements |
| `muted` | `#64707D` | Secondary text, placeholders, metadata labels |
| `border` | `#E4E9EE` | All card, input, table, and separator borders |
| `canvas` | `#F5F7FA` | Primary page background behind cards and containers |
| `surface` | `#FFFFFF` | Card backgrounds, popovers, dropdowns, table bodies |

### Accent Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `brand` ("pulse" cyan) | `#0AA5E8` | Accent only: active nav indicator, links, focus rings, primary chart series, live status pulse |
| `brand-tint` | `#E6F6FD` | Subtle hover backgrounds, active badge backgrounds |

### Signal & Semantic Tokens
| Token Name | Hex Code | Background Tint | Purpose |
| :--- | :--- | :--- | :--- |
| `signal` (orange) | `#FF7A1A` | `#FFF2E8` | Rare highlight, warning counters, secondary chart series |
| `success` | `#12A150` | `#E7F7ED` | Active links, healthy status, positive trend deltas |
| `warning` | `#E39B00` | `#FEF7E6` | Near click limit, expiring soon (<= 7 days) |
| `danger` | `#E5484D` | `#FEECEE` | Disabled links, expired links, blocklist, destructive actions |

### Data Visualization / Chart Palette (Strict Sequence)
1. `#0AA5E8` (Pulse Cyan - Primary series)
2. `#14181F` (Ink Dark - Contrast series)
3. `#FF7A1A` (Signal Orange - Secondary metric / comparisons)
4. `#8ED8F5` (Light Cyan - Secondary breakdown)
5. `#A7B1BC` (Slate Muted - Tertiary category / other)
6. `#12A150` (Forest Green - Conversion / success metric)

### Dark Mode Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `canvas` (dark) | `#0C0F14` | Main page background |
| `surface` (dark) | `#131820` | Container & card backgrounds |
| `border` (dark) | `#232B36` | Dark border lines |
| `text` (dark) | `#E8ECF1` | Primary text |
| `muted` (dark) | `#8B97A4` | Secondary text |
*Accent, signal, and semantic tokens remain consistent across light and dark modes.*

---

## Typography

Self-hosted via `@fontsource` packages for zero layout shift and offline reliability.
- **Headings & Page Titles**: `Montserrat`, font weights 600 (Semi-Bold) and 700 (Bold).
- **Body & UI Elements**: `Inter`, font weights 400 (Regular), 500 (Medium), and 600 (Semi-Bold).
- **Codes & URLs**: `JetBrains Mono`, font weight 400 and 500 (`font-mono`).
- **Numbers & Metrics**: Tabular numbers enabled (`font-variant-numeric: tabular-nums;` / `tabular-nums` in Tailwind) across all stat cards and tables.

---

## Spatial System & Layout

- **Base Grid**: 8px geometric grid (`p-2`, `p-4`, `p-6`, etc.).
- **Page Container**: Max-width `1280px`, page padding `24px` (`px-6 py-6`).
- **Corner Radii**:
  - Cards & Modals: `12px` (`rounded-xl`)
  - Inputs, Buttons & Dropdowns: `8px` (`rounded-md` / `rounded-lg`)
  - Status Badges & Pills: `9999px` (`rounded-full`)
- **Iconography**:
  - Exclusively `lucide-react`.
  - Standard sizes: `16px` (tables, buttons, inputs) and `20px` (sidebar, primary page headers).
  - Absolutely no emoji icons in the UI.

---

## Component Architecture & Rules

### Buttons
- **Primary**: Solid `ink` background (`#14181F`), white text (`#FFFFFF`), subtle hover transition to `#2B323C`. Never use full cyan fill for primary buttons.
- **Secondary / Outline**: White surface, 1px `#E4E9EE` border, `#14181F` text, hover `#F5F7FA`.
- **Destructive**: White surface with `#E5484D` border/text, or solid `#E5484D` for irreversible confirmations.
- **Ghost**: Transparent background, `#2B323C` text, `#F5F7FA` hover.

### Navigation & Shell
- **Sidebar**: Fixed width `240px`, dark background (`#14181F`), light text with soft muted inactive links. Collapses to slide-out drawer on viewport `< 1024px`.
- **Active Navigation Item**: Border indicator or solid pill with `#0AA5E8` accent accentuation.
- **Topbar**: Light surface (`#FFFFFF`), 1px bottom border (`#E4E9EE`), user profile avatar, breadcrumb or page quick links, dark mode toggle.
- **Standard Page Header**: Every view presents an explicit title (Montserrat 700), a 1-line descriptive subhead (Inter 400 `#64707D`), and an optional right-aligned primary action button.

### Tables & Data Views
- Sticky headers with `#F5F7FA` background and `#64707D` uppercase 11px label font.
- Hover highlight on rows (`hover:bg-[#F5F7FA]/60`).
- Status Badges: Small, soft-tinted pills (`rounded-full px-2.5 py-0.5 text-xs font-medium`).
  - Active: `#E7F7ED` bg with `#12A150` text and a 6px green indicator dot.
  - Disabled: `#FEECEE` bg with `#E5484D` text.
  - Expired: `#F5F7FA` bg with `#64707D` text.
  - Limited: `#FEF7E6` bg with `#E39B00` text.
- Standard Data States:
  - **Loading**: Pulse skeletons mirroring exact table row / card dimensions.
  - **Empty**: Centered empty illustration or icon, friendly descriptive prompt, clear CTA button.
  - **Error**: Explicit error banner or card with "Try Again" retry trigger.
- Interactive Feedback:
  - Instant sonner / Radix toasts for all operations (copy, create, update, delete).
  - Destructive operations require confirmation modal before execution.

---

## Responsive Breakpoints
- **Desktop (Primary Target)**: Viewport width >= `1440px`. Full sidebar, multi-column metric grids, expanded analytics charts.
- **Mobile (Primary Target)**: Viewport width `390px` (iPhone 14/15/16 standard). Collapsible hamburger sidebar drawer, single-column stacked metric cards, scrollable table containers with condensed priority columns.
- Minimum supported viewport: `375px`.
