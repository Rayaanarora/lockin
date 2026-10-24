# LOCKIN — Product & Engineering Handoff
## Master PRD / Technical Context Document

**Purpose:** This document is the single onboarding reference for anyone joining the LOCKIN project. Read this before modifying product logic, UI, database models, authentication, deployment, or realtime functionality.

**Current deployment target:** Vercel  
**Production domain:** `lockin.top`  
**Repository:** `github.com/faheemframes/lockin`

---

# 0. START HERE

## What is LOCKIN?

LOCKIN is a college-focused mission and social productivity platform.

The core idea is simple:

> **Stop chatting. Start showing up.**

LOCKIN is not primarily a chat app, social network, or generic productivity timer. It is built around **missions**: concrete things a student commits to doing, either alone or with other people.

Examples:

- Study for 3 hours.
- Work on an app for 1 hour.
- Go for a football session.
- Finish a set of coding tasks.
- Pull an all-nighter with friends.
- Meet people at a physical location and complete a shared mission.
- Complete a personal challenge and post the recap afterward.

The product loop is:

**Discover → Lock In → Execute → Complete → Recap → Build Reputation → Repeat**

The social layer exists to create accountability and momentum around actually doing things.

---

# 1. PRODUCT PHILOSOPHY

LOCKIN should feel like a place where people **do things**, not another place where they endlessly talk about doing things.

### Core principles

1. **Action over conversation**
   - The product should push users toward execution.
   - Avoid turning LOCKIN into another generic messaging platform.

2. **Real activity over fake engagement**
   - Never manufacture users, participants, comments, Aura, or social proof.
   - Empty states are preferable to fake activity.

3. **Missions are the core primitive**
   - Most major product systems should connect back to missions.

4. **Accountability should feel social**
   - Users should be able to see what others are doing without making the experience feel like a conventional social feed.

5. **Showing up matters**
   - Group missions can require attendance/check-in.
   - Completing a mission should create an actual record.

6. **Minimal, premium, slightly mysterious**
   - LOCKIN has a dark luxury/cyber aesthetic.
   - Do not turn the UI into noisy “gaming UI.”

7. **The deer is a persona, not the product**
   - Deer visuals can appear as subtle identity/feedback elements.
   - Do not allow the mascot to overpower the mission experience.

---

# 2. PRODUCT STATUS LEGEND

Throughout this document:

- **EXISTING** = part of the current product/codebase.
- **PARTIAL** = some implementation exists but should be verified before extending.
- **PLANNED** = intended feature, not necessarily implemented.
- **DEFERRED** = explicitly postponed.
- **DO NOT ASSUME** = discussed previously but implementation status must be checked in the repository.

When uncertain, inspect the code before building.

---

# 3. CORE PRODUCT CONCEPTS

## 3.1 User

A student/user with:

- Account
- Profile
- Reputation/Aura
- Activity history
- Missions
- Mission participation
- Social relationships
- Streak/activity data

Authentication is handled through **Supabase Auth**.

---

## 3.2 Mission

A mission is the fundamental LOCKIN object.

A mission represents a concrete commitment to spend time completing a goal.

Mission types:

- `solo`
- `group`

Relevant mission concepts include:

- Title
- Description
- Mission type
- Duration/focus duration
- Tasks
- Start/execution state
- Completion state
- Participants
- Location/time for applicable group missions
- Cover color/image
- Recap
- Aura/reputation effects

---

# 4. SOLO MISSIONS

Solo missions are individual commitments.

Examples:

> “Build my app for 2 hours.”

> “Study Computer Networks for 90 minutes.”

> “Work on my startup landing page.”

A user can:

1. Select/create a mission.
2. Lock in.
3. Execute it.
4. Complete tasks.
5. Finish the session.
6. Receive the appropriate outcome/reputation treatment.
7. Create/view a recap.
8. Have the activity reflected in their history/feed where applicable.

The important point:

**A solo mission is still a real mission record.**

It should not be treated as fake activity or simulated social content.

---

# 5. GROUP MISSIONS

Group missions allow users to commit to an activity together.

Potential characteristics:

- Host
- Participants
- Scheduled time
- Location
- Shared mission objective
- Tasks
- Focus/session duration
- Attendance/check-in

Group missions can include physical meetup verification.

### Group attendance/check-in

The existing product concept includes host verification using a short code.

The flow is approximately:

1. Host creates/configures group mission.
2. Mission has a scheduled time/location.
3. Participants join.
4. At execution, participants check in.
5. Host provides/verifies the mission check-in code.
6. Attendance is recorded.
7. Participants execute the mission.

Do not redesign this flow without first inspecting the existing implementation.

---

# 6. MISSION TASKS

Missions can contain tasks.

Tasks allow a mission to represent more than a single timer.

Example:

Mission:
> Build LOCKIN landing page — 2 hours

Tasks:
- Finish hero section
- Connect signup
- Test mobile layout
- Deploy

Task completion can contribute to the mission's efficiency/outcome logic.

A previously discussed direction is to calculate an efficiency score based on:

**time spent + task completion**

Do not invent a new scoring formula if an existing implementation already exists. Inspect current mission/task logic first.

---

# 7. MISSION EXECUTION

The mission execution experience can include:

- Timer
- Task checklist
- Mission progress
- Early checkout
- Completion
- Recap

The execution screen should be focused and distraction-resistant.

---

# 8. RUNWAY CRASH / FAILED SESSION

An existing product mechanic is the **Runway Crash** penalty.

Concept:

If a user exits a mission early, particularly when:

- less than 50% of the target time was completed, and
- zero tasks were completed,

the user can receive an Aura penalty.

The current documented behavior includes:

- **-5 Aura**
- Cracked-glass/failed recap visual treatment

Treat this as existing behavior unless repository inspection shows otherwise.

Do not casually change scoring rules because they affect reputation/history.

---

# 9. RECAPS

A completed mission can produce a recap.

Recaps are part of the emotional/social payoff of completing a mission.

A recap can communicate:

- What the user attempted
- How long they worked
- What they completed
- Outcome
- Aura/reputation impact
- Mission information
- Visual treatment

The recap should feel like a record of something the user actually did.

### Important design direction

The mission recap currently has a visual treatment involving a random gradient/road-like background.

The desired direction is to introduce the **deer persona subtly**.

Do not make the deer the dominant element.

---

# 10. AURA / REPUTATION

LOCKIN has a reputation/progression concept referred to as **Aura**.

Aura is intended to reflect meaningful participation and consistency.

Aura can be affected by mission outcomes.

Examples:

- Successful completion → positive progression
- Failure/Runway Crash → penalty
- Participation/attendance → potentially relevant depending on existing implementation

There are also leaderboard/progression concepts around Aura.

### Important

Aura is a core product mechanic.

Do not change:

- scoring values
- penalty values
- level thresholds
- leaderboard calculations

without checking existing backend logic and discussing the product impact.

---

# 11. STREAKS

LOCKIN includes streak-related functionality.

The purpose is to reinforce consistency.

There is also an existing streak-related product element referred to in development as **Starva/streak functionality**.

Before modifying it:

- Search the repository for the actual implementation/name.
- Determine the current data model.
- Determine whether streaks are calculated client-side or server-side.
- Preserve existing user history.

---

# 12. ACTIVITY HEATMAP

LOCKIN has a GitHub-style activity heatmap concept.

It represents user activity over time.

Potential inputs include completed missions/session activity.

The heatmap should represent actual recorded activity.

Do not fabricate historical activity to make a profile look populated.

---

# 13. SOCIAL FEED

LOCKIN includes a social/activity feed.

The feed can contain activity/posts associated with users and missions.

Existing social concepts include:

- Posts/feed items
- Comments
- Reactions
- Mission activity
- User activity

The social feed should remain connected to real product actions.

### Profile navigation

Users should be able to click a person from activity/feed content and reach their **public profile**.

---

# 14. PROFILES

## Private/current user's profile

The profile experience includes concepts such as:

- Avatar
- Aura/reputation
- Level/progression
- Mission history
- Activity
- Heatmap
- Streaks
- Metrics

The design direction includes a bento-style profile layout and animated progression elements.

## Public profile

Public profiles can expose:

- User identity/profile information
- Public activity/history
- Followers
- Following
- Relevant metrics
- Mission/activity history

Do not expose private authentication/account information.

---

# 15. FOLLOW SYSTEM

LOCKIN has a social follow/follower concept.

Users can:

- Follow other users.
- View followers/following.
- Navigate to public profiles.

Existing database/API behavior should be inspected before changing follow semantics.

---

# 16. SEARCH / DISCOVERY

The existing product includes profile search/discovery concepts.

Search should help users find people and relevant LOCKIN activity.

Avoid turning discovery into a generic content recommendation system unless explicitly requested.

---

# 17. SIDE QUEST / MISSION TEMPLATE SYSTEM

This is an important product direction for solving cold-start.

Instead of showing fake community missions, LOCKIN can surface curated **Mission Templates**.

These are not fake user activity.

Examples:

### Study
- 90-Minute Deep Work
- Finish One Chapter
- Exam Sprint

### Building
- Ship One Feature
- Fix Three Bugs
- Build for 60 Minutes

### Fitness
- 30-Minute Run
- Bodyweight Session
- Football Conditioning

### Creative
- Make One Short Film
- Write for 45 Minutes
- Shoot/Edit One Scene

### Life
- Clean Your Workspace
- Plan Your Week
- Digital Detox Session

### Social
- Meet Someone New
- Study With a Friend
- Coffee + Brainstorm

---

# 18. MISSION TEMPLATE DATA MODEL

The intended conceptual model is:

`MissionTemplate`

Possible fields:

- `id`
- `title`
- `description`
- `category`
- `estimatedDuration`
- `difficulty`
- `defaultTasks`
- `coverImage` / `coverColor`
- `isActive`
- `createdAt`
- `updatedAt`

Exact schema must match the current Prisma/database implementation if already created.

---

# 19. TEMPLATE UX

Templates should appear as clearly curated LOCKIN experiences.

Suggested labels:

- `LOCKIN QUEST`
- `SIDE QUEST`

Important:

They must **not look like real community activity**.

No:

- Fake participant counts
- Fake users
- Fake comments
- Fake Aura
- Fake social proof

### Solo

`Lock In Solo`

This should create a real Mission using the existing mission creation/execution logic.

### Group

`Want company? → Make it a Group Mission`

This should open the existing group-mission creation/configuration flow with the template information prefilled.

Do not build a second group-mission system.

---

# 20. TEMPLATE FEED BEHAVIOR

A subset of templates can be shown rather than displaying the exact same templates to everyone.

The goal is:

- Variety
- Cold-start assistance
- Immediate action

But the feed should not be redesigned just to support templates.

---

# 21. AUTHENTICATION

Current authentication provider:

**Supabase Auth**

Responsibilities:

- Sign up
- Login
- Session management
- Authentication state
- User identity

The application should not duplicate authentication logic unnecessarily.

---

# 22. EMAIL

LOCKIN has **Resend configured** for email delivery.

Resend is part of the current email architecture.

Supabase Auth remains the authentication provider.

When working on authentication/email:

- Inspect current Supabase Auth configuration.
- Inspect current Resend integration.
- Check environment variables.
- Do not replace Resend with another provider without discussion.
- Do not assume Supabase's default email service is the production email provider.

---

# 23. COLLEGE EMAIL / CAMPUS ACCESS

The original product architecture included campus-domain enforcement and email verification.

A documented example is:

`@srmist.edu.in`

There was also a 6-digit OTP verification system in the original architecture.

Because authentication has since moved to Supabase Auth, contributors must inspect the current implementation to determine exactly which verification/domain rules remain active.

Do not assume the old OTP implementation is still the source of truth.

---

# 24. REALTIME

Original architecture used:

**Socket.io**

Current direction:

**Supabase Realtime**

Realtime is used to replace stateful Socket.io functionality in the Vercel-compatible architecture.

Potential realtime use cases include:

- Notifications
- Mission-specific chat/activity
- Live mission state
- Other realtime updates

When implementing realtime:

- Prefer Supabase Realtime.
- Avoid bringing back long-lived Socket.io server connections.
- Keep the architecture compatible with Vercel's serverless deployment model.

---

# 25. DATABASE

Current database:

**Supabase PostgreSQL**

ORM:

**Prisma**

The application should use Prisma for normal database access where the existing backend architecture does so.

Supabase PostgreSQL is the underlying database.

Important concepts from the existing data model include:

- `User`
- `Mission`
- `Participation`
- `SessionRecap`
- `FeedItem`
- `Post`
- `Comment`
- `Reaction`
- `Otp`

The exact current schema must be checked in:

`backend/prisma/schema.prisma`

Do not assume this list is exhaustive or unchanged.

---

# 26. ORIGINAL DATABASE HISTORY

The project originally used a MySQL database and a traditional Node/Express deployment architecture.

That is historical context.

The project has since moved to:

**PostgreSQL on Supabase**

Do not reintroduce MySQL-specific logic.

The old repository documentation may contain outdated references.

---

# 27. BACKEND / API ARCHITECTURE

The project originally had a standalone:

- Node.js
- Express
- REST API
- Socket.io

server.

For Vercel deployment, the backend has been undergoing integration into the Next.js deployment architecture.

The target principle is:

**One Vercel deployment**

with:

- Next.js frontend
- API/backend functionality deployed through Vercel-compatible serverless routing
- Supabase for persistent/realtime infrastructure

### Critical

There have previously been deployment issues where `/api/users` returned 404 because the expected API routing was not actually present in the deployed frontend.

Therefore:

**Always verify the actual repository structure and Vercel deployment output before assuming API routes are working.**

Do not blindly trust an old migration walkthrough.

---

# 28. FRONTEND STACK

Current frontend stack:

- **Next.js 15**
- **React 19**
- **TypeScript**
- **Tailwind CSS 3**
- **Framer Motion**
- **Lucide React**

The UI is designed around a dark, premium, high-contrast aesthetic.

---

# 29. DESIGN SYSTEM

Core visual direction:

- Noir / near-black backgrounds
- Cherry red
- Luxury maroon
- Luxury gold
- High contrast
- Subtle gradients
- Glass effects
- Motion
- Minimal but expressive interactions

Known design tokens include:

- Luxury Gold: `#C5A880`
- Cherry Red: `#810100`

Status colors have historically included:

- Box Red: `#F52601`
- Box Orange: `#F78005`
- Box Green: `#18BD00`

Check `globals.css` and `tailwind.config.js` before adding new tokens.

---

# 30. TYPOGRAPHY

A previous design audit suggested moving toward premium typography such as:

- Outfit
- Plus Jakarta Sans

However, existing implementation should be checked before changing global typography.

Do not introduce multiple unrelated font systems.

---

# 31. GLASS / SURFACE DESIGN

There is an existing `.glass` visual class/concept involving:

- Gradient
- Border
- Shadow
- Backdrop blur

It has historically been underused.

Use glass surfaces intentionally rather than applying blur to everything.

---

# 32. SHELL / GLOBAL UI

The application shell includes concepts such as:

- Grid/noise background
- Floating ambient glows
- Mobile-first/max-width content behavior

Do not remove the atmospheric background system without considering the overall brand language.

---

# 33. NAVIGATION

The navigation has included:

- Animated active state
- Bottom navigation on mobile
- Header/navigation stats

The design direction is to elevate navigation using:

- Glass surface
- Micro-animations
- Subtle logo/stat treatments

Keep navigation functional and uncluttered.

---

# 34. FEED INTERACTION

The main feed has a Tinder-style swipe interaction.

Known behavior:

- Horizontal drag
- Approximate swipe threshold: `130px`
- Mission cards can be swiped

The design direction includes:

- Card rotation while dragging
- Dynamic overlays
- Deck depth
- Button microanimations

Do not rewrite the gesture system unless there is a concrete reason.

---

# 35. ACTIVE MISSIONS

Active missions show missions currently being executed.

Important states should be visually distinct:

- Active
- Completed
- Failed
- Upcoming
- Other states supported by the existing implementation

Avoid ambiguous status presentation.

---

# 36. PROFILE DESIGN

The profile direction includes:

- Bento-grid layout
- Avatar badge
- Progress indicator
- Level progression
- Subtle level-up animation/particles

Animations should reinforce progression, not become visual noise.

---

# 37. AUTH / LOCK SCREEN

The authentication/profile gate direction includes a visual:

- Ambient lock experience
- Dark/cyber styling
- Animated inputs
- Strong focus on the action

Again: keep it minimal.

---

# 38. CALENDAR INTEGRATION

Existing product functionality includes calendar integration.

Google Calendar:

- Client-side Google Calendar event URL generation

Outlook/Apple:

- `.ics` download flow

Do not add a heavy calendar API integration unless specifically required.

---

# 39. STORAGE

Supabase Storage is part of the current infrastructure.

Potential use cases include:

- Profile assets
- Mission cover images
- Other user-uploaded visual assets

Follow existing bucket/access-policy architecture.

Do not make user-uploaded content publicly accessible by default.

---

# 40. MISSION COVERS

Mission cards support custom visual treatments.

Existing concepts include:

- Cover color
- Gradient
- Cover image
- Base64/encoded visual content in parts of the historical implementation

Before changing image storage or rendering:

- Inspect current database representation.
- Inspect Supabase Storage usage.
- Avoid creating unnecessarily large database records.

---

# 41. SOCIAL DATA MODEL

Historical/current model concepts include:

- Feed items
- Posts
- Comments
- Reactions
- Follows
- Public profiles

Social interactions should be tied to authenticated users and real database records.

---

# 42. NO FAKE DATA

This is a hard product rule.

Do not add:

- Fake users
- Fake participants
- Fake activity
- Fake comments
- Fake likes/reactions
- Fake Aura
- Fake follower counts
- Fake mission completion

If cold-start is a problem, use:

**curated Mission Templates**

rather than fake community activity.

---

# 43. DEER PERSONA

The deer is the visual persona of LOCKIN.

Use it as:

- Subtle identity
- Empty-state visual
- Recap companion
- Small animation
- Brand element

Avoid:

- Full-screen mascot takeover
- Constant mascot animations
- Childish/cartoon-heavy treatment

The deer should support the product's identity without becoming the product.

---

# 44. DEFERRED FEATURES

The following have been explicitly discussed as later work rather than immediate priorities:

## AI Mission Generation

Deferred.

The initial approach is:

**Curated mission templates first.**

Later, AI can potentially generate missions using:

- User history
- Interests
- Activity
- Previous missions
- Goals

Do not build AI mission generation as part of the template MVP unless specifically assigned.

---

## LOCKIN Tools Tab

Ideas included:

- Pomodoro
- Distraction-free YouTube
- Other productivity tools

This has been explicitly deferred.

Do not create a new Tools tab unless the product owner requests it.

---

# 45. ANALYTICS / NOTIFICATIONS

Tools discussed for future expansion include:

- PostHog
- OneSignal

Treat these as planned/deferred unless confirmed in the repository.

Do not assume they are currently active.

---

# 46. DEPLOYMENT

Primary deployment platform:

**Vercel**

There should not be a separate Railway/Render backend deployment as part of the current architecture.

Target:

`lockin.top`

Source:

GitHub

---

# 47. VERCEL ARCHITECTURE PRINCIPLE

The project should remain compatible with Vercel's execution model.

Avoid:

- Long-lived Node processes
- Stateful in-memory server assumptions
- Socket.io server persistence
- Local filesystem persistence
- Local database assumptions

Use:

- Supabase PostgreSQL
- Supabase Realtime
- Supabase Storage
- Serverless-compatible API handlers
- Vercel deployment

---

# 48. ENVIRONMENT VARIABLES

The exact current environment variable names must be verified in the repository/Vercel project.

Historically/currently relevant variables include concepts such as:

```text
DATABASE_URL
DIRECT_URL
SUPABASE_URL
SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
```

Do not commit actual secrets.

Do not paste production secrets into GitHub.

Do not assume every variable listed above is still required; inspect the current code.

---

# 49. LOCAL DEVELOPMENT

Before starting work:

1. Clone the repository.
2. Install dependencies.
3. Read the README.
4. Inspect the root structure.
5. Inspect `frontend/`.
6. Inspect `backend/`.
7. Inspect Prisma schema.
8. Inspect Supabase-related code.
9. Inspect environment variable usage.
10. Run the application locally.
11. Verify authentication.
12. Verify API connectivity.
13. Verify database connectivity.

Do not start making architectural changes before understanding the current implementation.

---

# 50. IMPORTANT REPOSITORY CONTEXT

Historical root structure has included:

```text
/backend
/frontend
/.agents
README.md
migration/deployment documentation
```

Important frontend components historically include:

```text
frontend/components/
    Feed.tsx
    ActiveMissions.tsx
    SocialFeed.tsx
    Profile.tsx
    PublicProfile.tsx
    HeatMap.tsx
    RecapCard.tsx
    Shell.tsx
    Nav.tsx
    Header.tsx
    ProfileGate.tsx
    LockScreen.tsx

frontend/app/
    page.tsx
    types.ts
    globals.css
```

Backend historical areas include:

```text
backend/
    src/
    prisma/
        schema.prisma
        seed/
    controllers/
    routes/
    utils/
    server.js
```

**These paths are a guide, not a guarantee.**

The repository may have changed during the Vercel migration. Always inspect the actual current tree.

---

# 51. KNOWN ARCHITECTURAL MIGRATION

LOCKIN has gone through a significant architecture migration.

### Before

```text
Next.js frontend
        ↓
Node.js / Express backend
        ↓
Prisma
        ↓
MySQL/PostgreSQL
        +
Socket.io
```

### Current target

```text
Next.js
├── UI
└── Vercel-compatible API/backend
        ↓
      Prisma
        ↓
Supabase PostgreSQL

Supabase Auth
Supabase Realtime
Supabase Storage

Resend
   ↓
Email
```

Deployment:

```text
GitHub
   ↓
Vercel
   ↓
lockin.top
```

---

# 52. API SAFETY

All authenticated API operations should validate the authenticated user.

Never trust:

- User ID sent from the client
- Aura values from the client
- Mission ownership from the client
- Participation status from the client
- Completion status from the client

Server-side/database logic must enforce permissions.

---

# 53. AUTHORIZATION RULES

Examples of things that should be protected:

### User profile
A user can modify their own profile, not another user's.

### Mission
Only authorized users should be able to modify a mission.

### Group mission
Host-only actions should be protected server-side.

### Participation
Users should not be able to arbitrarily mark themselves as another participant.

### Aura
Aura must never be directly writable by a normal client request.

### Recap
Recap data should be generated/validated from actual mission/session state.

---

# 54. DATABASE RULES

When modifying Prisma models:

1. Understand existing relations.
2. Check existing production data.
3. Create proper migrations.
4. Test migrations locally.
5. Check indexes.
6. Check cascade behavior.
7. Check uniqueness constraints.
8. Consider query performance.
9. Do not casually rename fields used by the frontend/API.

---

# 55. REALTIME RULES

When adding realtime behavior:

- Use Supabase Realtime.
- Subscribe only to what is necessary.
- Clean up subscriptions when components unmount.
- Do not create duplicate subscriptions.
- Do not leak private mission/channel data.
- Do not use realtime as a substitute for database persistence.

Realtime is for synchronization/updates.

The database remains the source of truth.

---

# 56. FRONTEND ENGINEERING RULES

Prefer:

- Existing components
- Existing hooks/utilities
- Existing API abstractions
- Existing design tokens
- Existing animation patterns

Avoid:

- Duplicate components
- Duplicate mission logic
- Duplicate API clients
- One-off styling systems
- Hardcoded production data

---

# 57. PRODUCT ENGINEERING RULE

Before creating a new feature, ask:

> Does this strengthen the mission → execution → completion loop?

If not, it may not belong in the current product.

---

# 58. DO NOT OVERBUILD

LOCKIN is still an early product.

Do not turn simple features into large systems.

Examples:

- Calendar → simple event links are enough for now.
- Mission discovery → curated templates are enough for now.
- Realtime → Supabase Realtime is enough.
- Email → Resend is enough.
- AI missions → deferred.
- Productivity tools → deferred.

Build the smallest version that works.

---

# 59. DESIGN RULE

LOCKIN should not look like:

- A generic SaaS dashboard
- A Discord clone
- A productivity spreadsheet
- A generic social media app
- A childish gamified app

It should feel:

- Focused
- Dark
- Premium
- Fast
- Social
- Slightly mysterious
- Action-oriented

---

# 60. MOBILE-FIRST

LOCKIN is primarily a student mobile experience.

Always test:

- Small phone width
- Standard phone width
- Desktop
- Touch interactions
- Bottom navigation
- Swipe gestures
- Timer interactions

Do not optimize desktop at the expense of mobile.

---

# 61. PERFORMANCE

Avoid:

- Unnecessary client components
- Large image payloads
- Repeated API calls
- Unbounded feed queries
- Loading entire mission histories
- Large realtime subscriptions
- Excessive Framer Motion animations

Use:

- Pagination
- Lazy loading
- Proper database indexes
- Optimized images
- Cached/static data where appropriate

---

# 62. FEED PERFORMANCE

The feed should never load an unlimited number of posts/missions.

Use:

- Pagination or infinite scrolling
- Server-side filtering where appropriate
- Proper indexes
- Minimal payloads

Do not fetch entire user histories just to render a card.

---

# 63. MISSION PERFORMANCE

Mission execution must remain responsive.

Timer behavior should not depend exclusively on React rendering frequency.

Persist important state.

Do not assume the browser will remain open continuously.

---

# 64. ERROR HANDLING

Errors should be:

- Meaningful
- User-readable
- Logged appropriately
- Non-destructive

Never silently swallow authentication/database errors.

Avoid showing raw database errors to users.

---

# 65. SECURITY

Never commit:

- API keys
- Database passwords
- Supabase service-role keys
- Resend API keys
- Production credentials

Public client-side Supabase keys are not equivalent to server secrets, but database policies still need to be configured correctly.

Server-only credentials must remain server-side.

---

# 66. SUPABASE SECURITY

Review:

- Row Level Security
- Authenticated access
- Storage policies
- Realtime authorization
- Database permissions

Do not assume that because the frontend hides a button, the operation is secure.

Security must exist at the server/database layer.

---

# 67. EMAIL SECURITY

Resend API keys must remain server-side.

Email endpoints should:

- Authenticate where appropriate
- Validate recipient/user ownership
- Rate limit abuse-sensitive operations
- Avoid allowing arbitrary sender impersonation

---

# 68. CURRENT PRODUCT LOOP

The most important end-to-end experience is:

```text
User enters LOCKIN
        ↓
Discovers mission / template
        ↓
Locks in
        ↓
Executes mission
        ↓
Works through tasks
        ↓
Completes / exits
        ↓
Session outcome calculated
        ↓
Aura / streak / history updated
        ↓
Recap generated
        ↓
Activity can appear socially
        ↓
User returns for next mission
```

Every contributor should understand this loop.

---

# 69. COLD START STRATEGY

A major problem for a new social product is an empty feed.

LOCKIN's preferred solution is:

**Give users things to do before there is a large community.**

Mission Templates solve this without pretending that users exist.

This is fundamentally different from:

> “Let's show fake missions so the app looks populated.”

Do not fake community density.

---

# 70. FUTURE PRODUCT DIRECTION

Potential future layers:

### Personalization
AI-generated missions based on user behavior.

### Deeper reputation
More sophisticated Aura/progression.

### Better social discovery
Finding people based on shared goals/activity.

### Mission groups
Recurring teams and communities.

### Productivity tools
Pomodoro, distraction-free media, focus utilities.

### Analytics
Personal productivity insights.

These are future layers, not necessarily current implementation.

---

# 71. CONTRIBUTOR WORKFLOW

For every assigned task:

### Step 1 — Understand
Read the relevant component, API route, Prisma model, and existing UI.

### Step 2 — Trace
Follow the data flow:

```text
UI
→ API
→ Backend logic
→ Prisma
→ Supabase PostgreSQL
```

or, where relevant:

```text
UI
→ Supabase Auth / Realtime / Storage
```

### Step 3 — Identify reuse
Find existing logic before writing new logic.

### Step 4 — Implement
Make the smallest change that solves the requirement.

### Step 5 — Test
Test:

- Happy path
- Empty state
- Error state
- Authenticated state
- Unauthorized state
- Mobile
- Desktop

### Step 6 — Verify production implications
Check:

- Database migrations
- Environment variables
- Vercel compatibility
- Realtime behavior
- Security

---

# 72. BEFORE OPENING A PR

Check:

- Does the app build?
- Does TypeScript pass?
- Does the feature work locally?
- Are existing features still working?
- Are API routes reachable?
- Are authentication flows working?
- Are database migrations valid?
- Are there console errors?
- Are mobile interactions working?
- Did you accidentally introduce fake data?
- Did you expose secrets?
- Did you create duplicate logic?

---

# 73. VERCEL PRODUCTION CHECKLIST

After deployment verify:

### Application
- `lockin.top` loads.
- Authentication works.
- Login persists.
- Signup works.
- Email delivery works.
- Mission creation works.
- Mission execution works.
- Mission completion works.
- Recap works.
- Feed works.
- Profiles work.

### API
Check representative endpoints.

Especially verify that expected `/api/*` routes are actually deployed.

If an endpoint returns:

`404`

do not assume the backend is broken.

First determine whether the API route exists in the deployed Next.js/Vercel architecture.

### Database
Verify:

- Read
- Create
- Update
- Relations
- Authentication linkage

### Realtime
Verify:

- Subscription
- Event delivery
- Cleanup

---

# 74. KNOWN DEPLOYMENT LESSON

The project previously experienced this production symptom:

```text
POST https://lockin.top/api/users
ERR_CONNECTION_RESET
```

and:

```text
/api/users → 404
```

with Vercel logs showing the frontend request but no corresponding API function execution.

The lesson:

**Never assume a migration is complete merely because the frontend deploys successfully.**

Frontend deployment success ≠ API deployment success.

---

# 75. GITHUB / DOCUMENTATION WARNING

The repository may contain historical documentation describing:

- MySQL
- Railway
- Standalone Express deployment
- Socket.io
- Older email architecture

Treat those as historical unless verified against the current code.

The current architecture is intended to be:

**Vercel + Supabase + Prisma + Supabase Auth + Supabase Realtime + Supabase Storage + Resend**

---

# 76. WHAT NEW DEVELOPERS SHOULD NOT DO

Do not:

1. Add Railway.
2. Add Render.
3. Bring back Socket.io server infrastructure.
4. Reintroduce MySQL.
5. Replace Supabase Auth without discussion.
6. Replace Resend without discussion.
7. Create fake users.
8. Create fake mission participants.
9. Create fake engagement.
10. Build AI mission generation before the template system is stable.
11. Build the Tools tab without approval.
12. Create a second mission creation system.
13. Duplicate API/business logic.
14. Change Aura rules casually.
15. Break mobile navigation to improve desktop.
16. Add a new design system.
17. Commit secrets.
18. Assume old documentation represents the current deployment.

---

# 77. WHEN YOU ARE UNSURE

Use this hierarchy:

1. Current production behavior
2. Current source code
3. Current Prisma schema
4. Current environment/configuration
5. This handoff document
6. Historical documentation
7. Old README

If this document conflicts with the actual code, **inspect and resolve the discrepancy before making architectural assumptions.**

---

# 78. FIRST-DAY CHECKLIST FOR A NEW DEVELOPER

A new contributor should be able to answer these questions after onboarding:

### Product
- What problem does LOCKIN solve?
- What is a mission?
- What is the difference between solo and group?
- What happens when a mission is completed?
- What is Aura?
- What is a recap?
- What is the social feed?
- What is a Mission Template?

### Frontend
- Where is the main app entry?
- Where are mission cards?
- Where is the feed?
- Where is profile?
- Where is the recap?
- Where is navigation?

### Backend
- Where are API routes?
- Where is Express/backend logic?
- How does authentication reach backend operations?
- How does Prisma connect to Supabase?

### Infrastructure
- Where is PostgreSQL?
- Where is Auth?
- Where is Realtime?
- Where is Storage?
- Where is email?
- Where is deployment?

### Deployment
- What is the production domain?
- Where is the Vercel project?
- What environment variables are required?
- How do you verify an API route exists in production?

---

# 79. QUICK ARCHITECTURE MAP

```text
                    ┌─────────────────────┐
                    │      User           │
                    │  Mobile / Desktop   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Next.js        │
                    │ React + TypeScript  │
                    │ Tailwind + Motion   │
                    └──────────┬──────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
              ┌─────────────┐    ┌──────────────┐
              │ API/Backend │    │ Supabase     │
              │ Vercel      │    │ Auth         │
              │ compatible  │    │ Realtime     │
              └──────┬──────┘    │ Storage      │
                     │           └──────────────┘
                     ▼
                ┌─────────┐
                │ Prisma  │
                └────┬────┘
                     ▼
          ┌────────────────────┐
          │ Supabase PostgreSQL│
          └────────────────────┘

                     +
                     │
                     ▼
                ┌────────┐
                │ Resend │
                │ Email  │
                └────────┘
```

---

# 80. CURRENT STACK — ONE-LINE VERSION

> **LOCKIN is a Next.js 15 + React 19 + TypeScript application deployed entirely on Vercel, using Tailwind CSS + Framer Motion on the frontend, Prisma with Supabase PostgreSQL for data, Supabase Auth for authentication, Supabase Realtime for realtime functionality, Supabase Storage for files, and Resend for email.**

---

# 81. PRODUCT SUMMARY — ONE PARAGRAPH

> **LOCKIN is a college-focused mission platform built around accountability and execution. Users discover or create missions, lock in individually or with others, execute focused sessions, complete tasks, verify attendance where relevant, receive reputation/progression outcomes, and create recaps that can feed into a social activity layer. The product combines productivity with social accountability without relying on fake engagement. Its visual identity is dark, minimal, premium, and slightly mysterious, with a subtle deer persona.**

---

# 82. HANDOFF PRINCIPLE

The most important thing for anyone joining LOCKIN:

> **Do not build what sounds cool. Build what makes people lock in and actually show up.**

When making a technical decision, preserve:

**Speed → Reliability → Simplicity → Product coherence**

in that order, unless a security or data-integrity concern requires otherwise.

---

# END OF LOCKIN HANDOFF
