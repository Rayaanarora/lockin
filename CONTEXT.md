# LOCKIN — System Context & Master Engineering Overview
> **Last Updated:** October 25, 2026  
> **Production Target:** Vercel (`lockin.top`)  
> **Repository:** `https://github.com/faheemframes/lockin`  
> **Secondary Mirror:** `https://github.com/Rayaanarora/lockin`

---

## 1. What is LOCKIN?
**LOCKIN** is a mobile-first, college-focused mission and social accountability platform designed to turn student ideas into real-world proof of work.

* **Core Insight:** *"Dost toh sabke paas hote hain. Par karne waale kitne hain?"* (Everyone has friends; how many actually show up?)
* **Tagline:** **"Stop chatting. Start showing up."**
* **The Core Primitive:** **Missions** (15–90 min timed focus sprints, spontaneous build sessions, campus runs, hackathons, or study duels).
* **The Product Loop:**  
  `Discover (Campus Feed) → Lock In → Execute (Focus Sprint Timer) → OTP Check-In → Vibe Check & Aura → 3D Recap → Campus Leaderboard`

---

## 2. Tech Stack & Architecture

| Layer | Technologies | Notes |
|---|---|---|
| **Frontend Framework** | **Next.js 15.5** (React 19) | Hybrid architecture: App Router (`app/`) for views + Pages Router (`pages/api/`) for serverless API endpoints. |
| **Styling & Design** | **Tailwind CSS 3.4** + Custom Design Tokens | Dark luxury / cyber-minimal aesthetic. Colors: Noir Black (`#000000`), Cherry Crimson (`#D2042D`), Velvet Maroon (`#4A0002`), Cotton White (`#FFFFFF`). |
| **Typography** | **Apple SF Pro Display & Text** | Loaded via AppleFonts CDN with system fallback stack (`-apple-system`, `Inter`, `ui-sans-serif`). |
| **Animations** | **Framer Motion** | Spring physics, tactile drag-to-swipe card stack, 3D Comet card glare tilt (`preserve-3d`), modal popovers. |
| **Database** | **PostgreSQL** (AWS pooler via Supabase) | Managed via **Prisma ORM 5.14**. Connection pooler port 6543 + Direct port 5432. |
| **Authentication** | **Supabase Auth** + Campus Gate | Strict college domain verification (`srmist.edu.in` with KTR priority, 700+ Indian colleges). |
| **Realtime & Push** | **Supabase Realtime Broadcast** | Real-time join requests, host notifications, and browser HTML5 notifications. |
| **Deployment** | **Vercel** (`lockin.top`) | Monorepo structure configured with root `/frontend` deployment, Next.js serverless functions, and `vercel.json` edge headers. |

---

## 3. Directory Structure

```text
lockin_final/
├── CONTEXT.md                    # This master context file
├── LOCKIN_HANDOFF.md             # In-depth PRD & architecture handoff guide
├── backend/                      # Node.js backend controllers & Prisma schema
│   ├── prisma/
│   │   ├── schema.prisma         # Postgres schema (User, Mission, Participation, Recap, Post, College)
│   │   └── seed_side_quests.js   # Campus seed missions generator
│   └── src/
│       ├── config/               # Database and Supabase clients
│       ├── controllers/          # Business logic (auth, missions, tasks, recaps, posts, users)
│       └── middleware/           # Auth and role verification middleware
├── frontend/                     # Primary Next.js production codebase
│   ├── app/                      # App router screens
│   │   ├── page.tsx              # Main dashboard controller (Tabs: Missions, Runway, Feed, Profile)
│   │   ├── layout.tsx            # Global metadata, viewport, HTML shell
│   │   ├── globals.css           # Global CSS, theme variables, glassmorphic styles
│   │   ├── types.ts              # Core TypeScript interfaces (User, Mission, Post, Recap)
│   │   ├── feed/                 # Dedicated social feed route
│   │   ├── comet/                # 3D Comet interactive card showcase
│   │   ├── recap/[shareId]/      # Public shareable 3D mission recap card
│   │   └── reset-password/       # Hardened password reset flow
│   ├── components/               # Modular UI components
│   │   ├── Landing.tsx           # Unauthenticated landing page (brand statement & live previews)
│   │   ├── ProfileGate.tsx       # Onboarding, college check, student login, instant demo entry
│   │   ├── Feed.tsx              # Campus mission swipe deck with 3D card tilt & action buttons
│   │   ├── ActiveMissions.tsx    # Active mission runway (timers, OTP verification, vibe check)
│   │   ├── SocialFeed.tsx        # Campus social proof feed with filtering (college/followers/all)
│   │   ├── FeedPostCard.tsx      # Rich social card with likes, comments, and media
│   │   ├── Profile.tsx           # User stats, Aura badge, GitHub/Insta links, recap gallery
│   │   ├── RecapCard.tsx         # 3D flippable card with proof of work, stats, and WhatsApp share
│   │   └── ui/                   # Shared UI primitives (LockinLogo, AuraAvatar, dialog, input)
│   ├── lib/                      # Client utilities
│   │   ├── api.ts                # Unified API client with automatic demo/token headers
│   │   ├── requireAuth.ts        # Serverless auth helper for Next.js API routes
│   │   ├── supabase.ts           # Browser Supabase client & image storage upload
│   │   └── motion.ts             # Framer Motion spring presets & slide variants
│   ├── pages/api/                # Next.js Serverless API routes (Optional catch-all [[...path]].ts)
│   │   ├── auth/                 # check-domain, profile sync, me, demo, logout
│   │   ├── missions/             # feed, active, accept, pass, create, attendance, vibe
│   │   ├── users/                # profile update, lock status, heat map, leaderboard
│   │   ├── posts/                # campus feed posts, comments, likes
│   │   ├── recaps/               # mission recap generation, sharing, gallery
│   │   ├── tasks/                # mission subtasks batch creation
│   │   └── colleges/             # college directory search
│   ├── public/                   # Static assets, new logo lockup, PWA icons, manifest
│   ├── next.config.mjs           # Next.js optimization configuration
│   └── vercel.json               # Vercel deployment headers and routing config
└── supabase/
    └── security.sql              # Supabase storage bucket policies & RLS rules
```

---

## 4. Key Systems & Logic

### 4.1 Authentication & Instant Demo Login
* **College Verification:** Users enter their student email (e.g., `faheem@srmist.edu.in`). `/api/auth/check-domain` checks the master directory of 700+ Indian colleges, prioritizing SRM KTR (`collegeId: 1634`).
* **Supabase OTP / Password:** Magic link or password authentication. Confirmation redirect URL points dynamically to app origin (`lockin.top`).
* **1-Click Instant Demo Login:**
  * Available on both the **Splash Screen** and **Login Screen**.
  * Bypasses all email/OTP requirements and activates session as **User 101 (Faheem - SRM KTR Builder)**.
  * Tokens: `x-demo-user-id: 101` and `Authorization: Bearer demo-token-101`.
  * Persists in `localStorage` (`lockin_demo_active`, `lockin_demo_user`) and clears on logout.

### 4.2 Campus Missions Feed (`Feed.tsx`)
* **Campus Exclusive:** Automatically filters for missions hosted at the user's college (`collegeId: 1634`) or universal open quests (`collegeId: null`).
* **Deck Mechanics:**
  * Swipe Right / Click "Lock In" → Moves mission to Active Queue (`/api/missions/:id/accept`).
  * Swipe Left / Click "Pass" → Advances to next mission.
  * **Reset on Refresh:** Swiped-left missions return on browser refresh.
  * **3D Comet Tilt:** Real-time mouse/touch parallax and specular glare on cards.
  * **Guaranteed Feed Fallback:** If strict time/participations filter returns 0 missions, backend auto-relaxes constraints so the feed is never permanently blank.

### 4.3 Active Missions Queue & Sprints (`ActiveMissions.tsx`)
* **The Runway Limit:** Users can hold up to **3 active missions** simultaneously to prevent hoarding and encourage follow-through.
* **Mission Lifecycle:**
  1. `Accepted / Requested` → Waiting for start time or partner match.
  2. `Executing` → Deep focus timer countdown with full-screen focus mode.
  3. `Attendance Check` → Host generates a 4-digit verification code; co-builder enters it to verify physical presence.
  4. `Vibe Check & Feedback` → Rate collaboration (+2 Aura points for good chemistry).
  5. `Recap Generation` → Produces a flippable 3D recap card.

### 4.4 3D Recap Cards & Social Feed
* **Recap Card (`RecapCard.tsx`):** Front side shows title, sprint duration, date, host, and proof-of-work tasks; flip side displays partner vibe rating and Aura earned.
* **WhatsApp Share:** Formats an event invite text with deep link (`https://lockin.top/recap/:shareId`).
* **Social Feed (`SocialFeed.tsx`):** Tab to view what other campus builders have shipped, filterable by *My College*, *Following*, or *Everyone*.

---

## 5. Recent Upgrades & Commits (October 2026)

1. **Brand Identity Sheet Rebuild:**
   - Deployed centered, minimal, high-impact `Landing.tsx` for visitors.
   - New official logo assets (`logo-lockup.png`, `icon-192`, `icon-512`, `apple-touch-icon`).
   - Cleaned up color variables: Noir (`#000000`), Cherry Red (`#D2042D`), Velvet Maroon (`#4A0002`).
2. **API Route Hardening for Vercel:**
   - Switched Next.js catch-all routes from `[...path].ts` to optional catch-all `[[...path]].ts` across `missions`, `colleges`, `users`, `posts`, `tasks`, and `interests` to prevent 404s on root endpoint queries.
   - Fixed API client to use relative `/api` in production rather than attempting connection to `localhost:4000`.
3. **Password Recovery Hardening:**
   - Added recovery session validation on `reset-password/page.tsx`.
   - Clear "link invalid/expired" state with a 1-tap redirect to request a new link.
   - Automatic termination of other active sessions on successful password reset.
4. **Resilient Mission Seeding:**
   - Re-seeded 6 SRM KTR starter quests (Sunrise Run, Midnight Chai & Code Review, Night Owl Ship Sprint, LeetCode 75 Grind, UI/UX Jam, Hill Trail Trek) with rolling upcoming timestamps.

---

## 6. Environment Variables (`.env.local`)

```env
# Frontend API endpoint (Defaults to relative /api in production)
NEXT_PUBLIC_API_URL=/api

# Supabase Auth & Realtime
NEXT_PUBLIC_SUPABASE_URL=https://npzbdjkgyzvyzrlorxmo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wajGr0Dwqeq9RlpPRUPgrg_7uRKVJ8B

# PostgreSQL Database (Supabase AWS Pooler). Never commit real passwords: set these in Vercel / .env.local only.
DATABASE_URL="postgresql://postgres.npzbdjkgyzvyzrlorxmo:[YOUR-DB-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.npzbdjkgyzvyzrlorxmo:[YOUR-DB-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Production Frontend Origin
FRONTEND_URL=https://lockin.top
```

---

## 7. Essential Commands

```bash
# Install frontend dependencies
cd frontend && npm install

# Build & typecheck frontend
cd frontend && npm run build

# Start frontend in development mode
cd frontend && npm run dev

# Re-seed SRM KTR starter missions with fresh dates
node backend/prisma/seed_side_quests.js

# Sync schema with Postgres database
npx prisma db push --schema=backend/prisma/schema.prisma

# Deploy to GitHub (Triggers live Vercel deployment)
git add . && git commit -m "your message"
git push origin main
git push rayaan main
```
