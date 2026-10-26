---
target: signed-in app
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:D:\\lockin\\frontend\\frontend\\app\\page.tsx"
timestamp: 2026-10-26T09-21-26Z
slug: frontend-app-page-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector + browser sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Queue says "Nothing needs you right now" while cards are still loading |
| 2 | Match System / Real World | 2 | Grit, W/L "+2/−1", "LOCKIN PROTOCOL", "On demand", "In 0h 2m" unexplained |
| 3 | User Control and Freedom | 2 | No undo for Pass on the deck; W/L rating is one tap and final |
| 4 | Consistency and Standards | 3 | Inbox pills/circles vs square brand elsewhere; "Needs you 3" shown twice |
| 5 | Error Prevention | 2 | Rating offered mid-session with no confirm; global ←/→ passes/locks cards |
| 6 | Recognition Rather Than Recall | 3 | Check-in code must be remembered/relayed by hand |
| 7 | Flexibility and Efficiency | 2 | Arrow-key shortcuts exist but are invisible; no deck search |
| 8 | Aesthetic and Minimalist Design | 3 | Crimson used 5× on one mission card; Queue cards stack 7 groups |
| 9 | Error Recovery | 3 | "Queue full" names cause and fix |
| 10 | Help and Documentation | 1 | Nothing explains Grit, check-in, W/L, the 3-mission limit |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
Mostly product-specific. Missions deck and Queue cards are unmistakably LOCKIN. Inbox list, Notifications rows and Profile drift toward generic dark-social templates; the pink 3D heart emoji is the most off-brand pixel.
Deterministic scan: CLI 0 findings (regex-only; undercounts). Rendered overlay (CSP bypassed in test browser only): real issues = 9px "Check In" button text and 4.2:1 contrast (ActiveMissions.tsx:802), 10px status pills (ActiveMissions.tsx:699), Side Quest chip 4.3:1 at 10px (Feed.tsx:1240), nested panels inside Queue cards; false positives = logo red O (exempt), brand eyebrows, single-font system.
Measured: no horizontal overflow, all images have alt, all controls named, one H1 per view. Under-44px: category tabs 40px, Queue avatar buttons 32px, ROSTER 68x16, CHECK IN 56x24, profile sub-tabs 40px, inbox search 40px. Mobile nav labels 10px.

## Priority Issues
- [P1] Deck PASS / LOCK IN sit behind the bottom nav on phone (390x844); "Queue full" banner pushes them further. Fix: fit card to viewport, pin action bar above nav, fold "Queue full" into it. → layout
- [P1] W/L rating: irreversible, offered mid-session, unexplained (ActiveMissions.tsx ~1152-1160). Fix: rate on an end-of-session screen with summary + Grit, explain W/L, undo window. → clarify + delight
- [P1] Global ←/→ handler passes/locks missions while focus is on tabs/buttons (Feed.tsx:353-358). Fix: scope to the deck, ignore tab/button/link targets, show hint, add undo for pass. → harden
- [P1] Queue "Check In" action at 9px text, 4.2:1, 56x24 hit area; status pills 10px; avatar/ROSTER targets 16-32px. Fix: ≥12px text, ≥44px targets, ≥4.5:1. → harden / typeset
- [P2] Crimson overused (5× per mission card, every mission chat avatar ring, tinted new notifications) so urgency loses meaning. → quieter
- [P2] Jargon and time format ("In 0h 0m", LOCKIN PROTOCOL, Grit, W/L) with zero help. → clarify + onboard

## Persona Red Flags
Casey: deck actions clipped by nav; CHECK IN below the fold behind calendar links; fast swipes pass with no undo.
Jordan: "100 GRIT" never explained; Side quest vs Focus session vs LOCKIN PROTOCOL on one card; "Queue full" before knowing the queue; landing has LOG IN and I HAVE AN ACCOUNT as duplicate paths.
Sam: ←/→ hijack while tabbing; 4 code cells need a group label; unread dots aria-hidden.

## Minor Observations
Queue loading copy contradicts skeletons; desktop Missions header dead band and centered tabs; desktop DECLINE ghost very faint; chips row overflows without fade; Profile logout sits next to Edit as an equal; mission chat rows say "Your mission chat" repeatedly; Feed delete icon too prominent; inbox and profile lack section headings.

## Questions to Consider
- Why is check-in a form field in a list rather than a full-screen moment?
- Should the deck be shown at all when the queue is full?
- Is a binary W/L of a peer the right ending for a "prove you showed up" product?
