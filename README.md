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
- **Authentication**: Firebase Authentication with email verification links.
- **Database schema**: Supabase Postgres migrations are retained for a future data backend; browser-local data is used by the current UI.

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Firebase account; Supabase is optional for the retained database schema

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/linkpulse.git
cd linkpulse

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Update .env.local with your Firebase web app configuration
```

### Running Locally
```bash
# Start frontend development server
npm run dev

# Or run with Netlify CLI to test Functions and Edge Functions
npx netlify dev
```

### Firebase email verification and authentication

Firebase Authentication handles email/password sign-up and sign-in. New users receive Firebase's email verification link; unverified accounts cannot sign in. Supabase Auth is not used by the frontend.

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a Firebase project.
2. In **Project settings → General → Your apps**, add a **Web app** and copy its configuration values.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, ensure `localhost` and your deployed site's domain are listed.
5. In VS Code, copy `.env.example` to `.env.local`. Fill in the `VITE_FIREBASE_*` values from your Firebase web app configuration, including `VITE_FIREBASE_MEASUREMENT_ID` to enable Analytics. These browser config values are not Admin SDK credentials. `.env.local` is ignored by Git. Restart `npm run dev` after saving.
6. Run the app, sign up with an inbox you can access, and click Firebase's verification link from that same browser. The link returns to `/login`; sign in with the email and password you chose.
7. In **Authentication → Templates**, customize the verification email if desired. Firebase's default verification template includes a working link; for production, use your own authorized domain for the app and Firebase action links.

Firebase Analytics initializes when the browser supports it and a Measurement ID is configured. Update your privacy notice and obtain any consent required in your users' regions before deploying analytics.

Admin authorization uses Firebase ID token custom claims (`admin: true` or `role: "admin"`). Set those claims only from a trusted server using the Firebase Admin SDK; never add a client-side admin role switch for real accounts. Supabase SQL profile roles do not grant Firebase admin access.

### Data and analytics scope

Links, campaigns, clicks, and moderation data are currently stored in the browser's local storage. Analytics uses recorded redirect events from that browser and refreshes every five seconds; it does not use seeded traffic or invented location data. It is not shared across devices or users. Supabase migrations remain as a database schema, but Firebase ID tokens are not Supabase Auth sessions; connect a trusted backend or Firebase database before using Supabase Row Level Security with Firebase-authenticated users.

## License
MIT
