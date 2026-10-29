export interface StarterQuest {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  pillar: "Physical" | "Grind" | "Discipline" | "Social" | "Academics" | "Research";
  groupTag?: "SRM & Campus Academics" | "Computer Science & Engineering" | "App Research & Internet Trends" | "Physical & Vitality" | "Discipline & Focus" | "Social & Collaboration" | string;
  categoryId: number;
  categoryName: string;
  missionType: "solo" | "group";
  focusDuration: number;
  defaultLocation: string;
  tasks: string[];
  coverColor: string;
  coverImage: string;
  badge: string;
}

export const STARTER_QUESTS: StarterQuest[] = [
  // ─── PILLAR: PHYSICAL / VITALITY ──────────────────────────────────
  {
    id: "run-5km",
    title: "Run 5 km — Sunrise Cardio Lock-In",
    shortTitle: "Run 5 km",
    description: "5km paced campus loop. Beat the heat, flush out cortisol, and build high-output aerobic stamina before the day begins.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 35,
    defaultLocation: "Campus Track / Ground",
    tasks: [
      "Dynamic warm-up & hamstring stretches (5 min)",
      "5.0 km continuous steady-state run",
      "Cool-down walk & 500ml electrolyte rehydration"
    ],
    coverColor: "#10B981",
    coverImage: "linear-gradient(135deg, #062b1a 0%, #050505 100%)",
    badge: "5 KM"
  },
  {
    id: "100-pushups",
    title: "100 Pushups — Upper Body Grit Trial",
    shortTitle: "100 Pushups",
    description: "4 clean sets of 25 pushups with strict chest-to-deck form. High muscle recruitment, zero equipment needed, pure activation.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 20,
    defaultLocation: "Hostel Room / Gym",
    tasks: [
      "Wrist & shoulder warmup rotations",
      "Set 1 & 2: 25 strict standard pushups",
      "Set 3 & 4: 25 controlled diamond or wide pushups",
      "3-minute pectoral doorframe stretch"
    ],
    coverColor: "#B11226",
    coverImage: "linear-gradient(135deg, #2a0705 0%, #0b0b0b 100%)",
    badge: "100 REPS"
  },
  {
    id: "cold-shower",
    title: "Cold Shower 3 Min — Shock Baseline Reset",
    shortTitle: "Cold Shower",
    description: "3 minutes at full cold tap. Forces deep diaphragmatic breathing, spikes natural dopamine by 250%, and eliminates morning lethargy.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 15,
    defaultLocation: "Hostel Washroom",
    tasks: [
      "30 seconds deep box breathing before stepping in",
      "Step into direct cold water (chest & neck immersion)",
      "Control breathing rhythm for 3 full minutes",
      "Vigorous towel dry & deliberate posture alignment"
    ],
    coverColor: "#0ea5e9",
    coverImage: "linear-gradient(135deg, #072235 0%, #050505 100%)",
    badge: "3 MIN"
  },
  {
    id: "sunlight-walk",
    title: "15-Min Sunlight Walk — Circadian Reboot",
    shortTitle: "Sunlight Walk",
    description: "Direct morning sunlight exposure within 45 minutes of waking. Natural photons set your sleep timer and elevate daytime alert state.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 20,
    defaultLocation: "Campus Promenade / Courtyard",
    tasks: [
      "Leave sunglasses and phone inside pockets",
      "Brisk 15-minute natural sunlight walk",
      "Drink 1 tall glass of water with a pinch of salt"
    ],
    coverColor: "#C5A880",
    coverImage: "linear-gradient(135deg, #241b10 0%, #0b0b0b 100%)",
    badge: "SUNLIGHT"
  },
  {
    id: "hydration-mobility",
    title: "3L Hydration & Full Spine Decompress",
    shortTitle: "3L Hydration",
    description: "Rehydrate the nervous system and unlock tight hip flexors and lower back from hours in lecture hall chairs.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 25,
    defaultLocation: "Anywhere",
    tasks: [
      "Fill and consume first 1L bottle of water",
      "Couch stretch (2 min per side for hip flexors)",
      "Cat-cow and thoracic spine extensions (10 reps)",
      "Deep resting squat hold (3 minutes cumulative)"
    ],
    coverColor: "#10B981",
    coverImage: "linear-gradient(135deg, #0b231c 0%, #050505 100%)",
    badge: "MOBILITY"
  },

  // ─── PILLAR: DISCIPLINE & ENVIRONMENT ─────────────────────────────
  {
    id: "clean-room",
    title: "Clean Room & Workspace — Environment Reset",
    shortTitle: "Clean Room",
    description: "Physical chaos creates cognitive drag. Make your bed with military corners, wipe desk surface, bin clutter, and vacuum floor.",
    pillar: "Discipline",
    categoryId: 19,
    categoryName: "Other",
    missionType: "solo",
    focusDuration: 25,
    defaultLocation: "Hostel / Apartment",
    tasks: [
      "Make bed tight & stow pillows cleanly",
      "Clear desk down to monitor, laptop, and notebook",
      "Discard trash, old wrappers, and empty cups",
      "Fold clean clothes & stow laundry bag"
    ],
    coverColor: "#C5A880",
    coverImage: "linear-gradient(135deg, #1f1b13 0%, #080808 100%)",
    badge: "RESET"
  },
  {
    id: "digital-declutter",
    title: "Digital Declutter — Desktop & Tab Zero",
    shortTitle: "Desktop Zero",
    description: "Close 30+ browser tabs, empty Downloads folder, organize messy code repos, and wipe phone home screen of distracting badges.",
    pillar: "Discipline",
    categoryId: 19,
    categoryName: "Other",
    missionType: "solo",
    focusDuration: 20,
    defaultLocation: "Workstation",
    tasks: [
      "Bookmark or close all browser tabs older than 24 hours",
      "Archive or empty Downloads folder to 0 items",
      "Git prune stale local branches across projects",
      "Turn off non-essential notifications on phone"
    ],
    coverColor: "#8B5CF6",
    coverImage: "linear-gradient(135deg, #180d28 0%, #060606 100%)",
    badge: "CLEAN"
  },
  {
    id: "zero-doomscroll",
    title: "Zero Doomscrolling — 12-Hour Feed Fast",
    shortTitle: "Feed Fast",
    description: "Zero TikTok, Reels, or infinite algorithmic feeds for the entire day. Reclaim 90+ minutes of lost attention span.",
    pillar: "Discipline",
    categoryId: 19,
    categoryName: "Other",
    missionType: "solo",
    focusDuration: 60,
    defaultLocation: "Everywhere",
    tasks: [
      "Set app limits or move feed apps into hidden folder",
      "Replace feed urges with 10 deep breaths or quick walk",
      "Log end-of-day screen time under 2.5 hours total"
    ],
    coverColor: "#B11226",
    coverImage: "linear-gradient(135deg, #2a0705 0%, #0b0b0b 100%)",
    badge: "DETOX"
  },
  {
    id: "night-blueprint",
    title: "Night Blueprint — Tomorrow Planned in 10 Min",
    shortTitle: "Night Blueprint",
    description: "Never wake up wondering what to do. Lay out clothes, pack your bag, and lock in top 3 non-negotiables before sleep.",
    pillar: "Discipline",
    categoryId: 19,
    categoryName: "Other",
    missionType: "solo",
    focusDuration: 15,
    defaultLocation: "Desk / Bedside",
    tasks: [
      "Write down the 3 non-negotiable tasks for tomorrow",
      "Pack bag with charged laptop, notebook, and water bottle",
      "Put phone to charge at least 5 feet away from bed"
    ],
    coverColor: "#6366F1",
    coverImage: "linear-gradient(135deg, #11142e 0%, #050505 100%)",
    badge: "BLUEPRINT"
  },
  {
    id: "no-sugar-24h",
    title: "24h Sugar Fast — Metabolic Reset Trial",
    shortTitle: "No Sugar 24h",
    description: "24 hours without sodas, packaged juices, pastries, or sweet chai. Stabilize insulin spikes and eradicate mid-afternoon brain fog.",
    pillar: "Discipline",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 45,
    defaultLocation: "Campus Canteen & Mess",
    tasks: [
      "Drink black coffee or plain green tea instead of sweet drinks",
      "Choose whole meals: eggs, paneer, chicken, or lentils",
      "Zero desserts or biscuits post-dinner"
    ],
    coverColor: "#10B981",
    coverImage: "linear-gradient(135deg, #092015 0%, #050505 100%)",
    badge: "24 HOURS"
  },

  // ─── PILLAR: DEEP WORK & GRIND ────────────────────────────────────
  {
    id: "deep-work-60m",
    title: "Deep Work Sprint (60 Min Airplane Mode)",
    shortTitle: "Deep Work 60m",
    description: "Full lock-in on one high-leverage task. Phone on do-not-disturb, single window maximized, uninterrupted cognitive flow.",
    pillar: "Grind",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 60,
    defaultLocation: "Library Quiet Zone",
    tasks: [
      "Select single core task & close unrelated apps",
      "Trigger 60-minute uninterrupted focus timer",
      "Document output snapshot & commit changes"
    ],
    coverColor: "#B11226",
    coverImage: "linear-gradient(135deg, #290909 0%, #0a0a0a 100%)",
    badge: "60 MIN"
  },
  {
    id: "leetcode-trio",
    title: "LeetCode Trio — 3 Mediums Zero Hints",
    shortTitle: "3 LeetCodes",
    description: "Solve 3 graph, dynamic programming, or sliding window problems without opening solutions. Dry-run edge cases manually first.",
    pillar: "Grind",
    categoryId: 12,
    categoryName: "Competitive Programming",
    missionType: "solo",
    focusDuration: 75,
    defaultLocation: "Library / Hostel Desk",
    tasks: [
      "Problem 1: Trees / Graph Traversal (DFS/BFS)",
      "Problem 2: Two Pointers or Sliding Window",
      "Problem 3: DP Subarray or Matrix Path",
      "Analyze time & space complexities on paper"
    ],
    coverColor: "#eab308",
    coverImage: "linear-gradient(135deg, #241c08 0%, #050505 100%)",
    badge: "3 MEDIUMS"
  },
  {
    id: "ship-feature",
    title: "Ship 1 Live Feature — Commit to Production",
    shortTitle: "Ship 1 Feature",
    description: "Stop endless refactoring. Polish one functional component or API route, write sanity tests, deploy to Vercel/Production.",
    pillar: "Grind",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 90,
    defaultLocation: "Tech Park / Workstation",
    tasks: [
      "Scope smallest shippable improvement",
      "Code & manually test edge cases locally",
      "Create PR, merge, and verify live on production build"
    ],
    coverColor: "#6366F1",
    coverImage: "linear-gradient(135deg, #121530 0%, #050505 100%)",
    badge: "SHIP IT"
  },
  {
    id: "library-2h-lockin",
    title: "Library 2-Hour Lock-In — Syllabus Crush",
    shortTitle: "Library 2h",
    description: "Two 50-minute study blocks with 10-minute quiet stretch. Clear an entire unit of technical syllabus or research papers.",
    pillar: "Grind",
    categoryId: 9,
    categoryName: "Study Sessions",
    missionType: "group",
    focusDuration: 110,
    defaultLocation: "Campus Central Library 2nd Floor",
    tasks: [
      "Block 1 (50 min): Deep concept reading & note extraction",
      "10-min hydration & eye rest away from screens",
      "Block 2 (50 min): Solve 5 past exam / textbook practice problems",
      "Summarize cheat sheet into 1 index card"
    ],
    coverColor: "#8B5CF6",
    coverImage: "linear-gradient(135deg, #1b0f2e 0%, #080808 100%)",
    badge: "2 HOURS"
  },
  {
    id: "read-20-pages",
    title: "Read 20 Pages — High-Signal Non-Fiction",
    shortTitle: "Read 20 Pages",
    description: "Read 20 pages of engineering, biography, or philosophy. Highlight key insights and write a 1-sentence mental takeaway.",
    pillar: "Grind",
    categoryId: 13,
    categoryName: "Reading",
    missionType: "solo",
    focusDuration: 30,
    defaultLocation: "Quiet Spot / Balcony",
    tasks: [
      "Read 20 continuous pages without skimming",
      "Annotate or highlight top 3 memorable passages",
      "Write 1-sentence synthesis in personal notes"
    ],
    coverColor: "#C5A880",
    coverImage: "linear-gradient(135deg, #231c11 0%, #070707 100%)",
    badge: "20 PAGES"
  },

  // ─── PILLAR: CAMPUS & SOCIAL FELLOWSHIP ───────────────────────────
  {
    id: "midnight-chai-code",
    title: "Midnight Chai & Code Review",
    shortTitle: "Midnight Chai",
    description: "Late night debugging session over hot cutting chai and Maggi at Java Canteen. Bring laptops, active pull requests, and tough compiler bugs.",
    pillar: "Social",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "group",
    focusDuration: 45,
    defaultLocation: "Campus Java Canteen",
    tasks: [
      "Order hot chai and assemble laptops",
      "Walk through PR architecture & tricky bugs",
      "Benchmark test coverage and merge clean code"
    ],
    coverColor: "#B11226",
    coverImage: "linear-gradient(135deg, #2b0805 0%, #080808 100%)",
    badge: "CHAI & CODE"
  },
  {
    id: "campus-build-duo",
    title: "Campus Build Duo — Silent Co-Working",
    shortTitle: "Co-Work Duo",
    description: "Find a builder peer in library or student lounge. Commit to 90 minutes of parallel work with mutual accountability.",
    pillar: "Social",
    categoryId: 9,
    categoryName: "Study Sessions",
    missionType: "group",
    focusDuration: 90,
    defaultLocation: "Library Reading Hall",
    tasks: [
      "Share each person's target goal before starting timer",
      "Silent 90-minute parallel grind block",
      "Debrief outcomes and celebrate progress together"
    ],
    coverColor: "#6366F1",
    coverImage: "linear-gradient(135deg, #101533 0%, #050505 100%)",
    badge: "DUO"
  },
  {
    id: "inbox-zero",
    title: "Inbox Zero — Backlog Annihilation",
    shortTitle: "Inbox Zero",
    description: "Reply to unanswered college emails, clear pending WhatsApp group notices, and archive resolved tickets to achieve zero pending items.",
    pillar: "Discipline",
    categoryId: 19,
    categoryName: "Other",
    missionType: "solo",
    focusDuration: 25,
    defaultLocation: "Desk",
    tasks: [
      "Process college inbox down to 0 unread messages",
      "Confirm assignments and lab schedule deadlines",
      "Archive dead threads and mute noise groups"
    ],
    coverColor: "#10B981",
    coverImage: "linear-gradient(135deg, #072418 0%, #050505 100%)",
    badge: "ZERO"
  },
  {
    id: "cold-outreach",
    title: "Builder Outreach — Connect with 1 Senior or Mentor",
    shortTitle: "Mentor Ping",
    description: "Write a personalized, concise message to a senior engineer, alumni, or founder whose work you respect. Ask for specific feedback.",
    pillar: "Social",
    categoryId: 17,
    categoryName: "Networking",
    missionType: "solo",
    focusDuration: 25,
    defaultLocation: "Workstation / LinkedIn",
    tasks: [
      "Research the person's recent project or post",
      "Draft a 3-sentence message with genuine appreciation and 1 clear ask",
      "Send and log follow-up date"
    ],
    coverColor: "#C5A880",
    coverImage: "linear-gradient(135deg, #241b10 0%, #070707 100%)",
    badge: "NETWORK"
  },
  {
    id: "breathwork-meditation",
    title: "10-Min Box Breathwork — Calm Under Pressure",
    shortTitle: "Breathwork",
    description: "4-4-4-4 box breathing pattern (inhale 4s, hold 4s, exhale 4s, hold 4s). Downregulates sympathetic nervous system and sharpens executive focus.",
    pillar: "Physical",
    categoryId: 8,
    categoryName: "Fitness",
    missionType: "solo",
    focusDuration: 15,
    defaultLocation: "Quiet Corner",
    tasks: [
      "Sit upright with spine straight and eyes closed",
      "Perform 12 complete cycles of box breathing",
      "Notice mental stillness before returning to work"
    ],
    coverColor: "#0ea5e9",
    coverImage: "linear-gradient(135deg, #091e2b 0%, #050505 100%)",
    badge: "CALM"
  },

  // ─── PILLAR: SRM & CAMPUS ACADEMICS (CTS, LABS, PLACEMENTS) ─────────
  {
    id: "srm-ct-crunch",
    title: "Cycle Test (CT) 2-Unit Crunch — High-Yield Lock-In",
    shortTitle: "CT 2-Unit Prep",
    description: "50-minute focused revision of 2 high-yield units. Past 3 years questions, derivation summaries, formula cheat sheets. Zero phones.",
    pillar: "Academics",
    groupTag: "SRM & Campus Academics",
    categoryId: 9,
    categoryName: "Study Sessions",
    missionType: "solo",
    focusDuration: 50,
    defaultLocation: "SRM KTR Central Library 2nd Floor",
    tasks: [
      "Summarize Unit 1 key theorems & derivations (20 min)",
      "Solve 3 previous year CT question papers (20 min)",
      "Blind recall self-quiz on Unit 2 edge cases (10 min)"
    ],
    coverColor: "#f59e0b",
    coverImage: "linear-gradient(135deg, #261b05 0%, #050505 100%)",
    badge: "CT GRIND"
  },
  {
    id: "srm-lab-fat-viva",
    title: "Lab FAT & Viva Code Sprint — Raw Terminal Trial",
    shortTitle: "Lab FAT / Viva",
    description: "Simulate the strict lab exam environment. Write and debug C++/Java/Python algorithms from scratch in raw terminal with zero AI autocompletion.",
    pillar: "Academics",
    groupTag: "SRM & Campus Academics",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 45,
    defaultLocation: "SRM KTR Tech Park Lab",
    tasks: [
      "Implement primary lab exercise on raw compiler (20 min)",
      "Debug segmentation faults & memory edge cases (15 min)",
      "Oral defense / viva rapid-fire recall (10 min)"
    ],
    coverColor: "#e11d48",
    coverImage: "linear-gradient(135deg, #26050e 0%, #050505 100%)",
    badge: "LAB FAT"
  },
  {
    id: "srm-tech-park-lockin",
    title: "Tech Park 90-Min Academic Deep Lock-In",
    shortTitle: "Tech Park Lock-In",
    description: "No-distraction study lock-in at Tech Park. Head down, noise-canceling headphones, knocking out textbook chapters before tomorrow's 8 AM.",
    pillar: "Academics",
    groupTag: "SRM & Campus Academics",
    categoryId: 9,
    categoryName: "Study Sessions",
    missionType: "group",
    focusDuration: 90,
    defaultLocation: "SRM KTR Tech Park 5th Floor",
    tasks: [
      "Setup workspace with water & silenced phone",
      "Deep Block Part 1: Heavy theoretical concepts (45 min)",
      "Deep Block Part 2: Numerical problems & assignment finish (45 min)"
    ],
    coverColor: "#6366f1",
    coverImage: "linear-gradient(135deg, #121430 0%, #050505 100%)",
    badge: "90M STUDY"
  },
  {
    id: "placement-oa-trial",
    title: "Placement OA Mock — 60-Minute Timed Test",
    shortTitle: "Placement OA",
    description: "Timed campus recruitment test simulation (TCS/CTS/Amazon patterns). 2 medium DSA problems, 10 core CS questions, strict 60m timer.",
    pillar: "Academics",
    groupTag: "SRM & Campus Academics",
    categoryId: 11,
    categoryName: "Placements",
    missionType: "solo",
    focusDuration: 60,
    defaultLocation: "SRM KTR Tech Park",
    tasks: [
      "Solve DSA Problem 1: Array/Map pattern in 20 min",
      "Solve DSA Problem 2: Tree/Graph BFS in 25 min",
      "Review 10 Core CS aptitude & OS/DBMS MCQs (15 min)"
    ],
    coverColor: "#e11d48",
    coverImage: "linear-gradient(135deg, #2c0710 0%, #050505 100%)",
    badge: "OA TRIAL"
  },

  // ─── PILLAR: COMPUTER SCIENCE & ENGINEERING ────────────────────────
  {
    id: "cs-os-concurrency",
    title: "OS Deep Dive: Processes, Threads & Semaphores",
    shortTitle: "OS & Concurrency",
    description: "Mastering operating systems fundamentals: process synchronization, deadlock avoidance (Banker's Algorithm), and virtual memory paging.",
    pillar: "Grind",
    groupTag: "Computer Science & Engineering",
    categoryId: 9,
    categoryName: "Study Sessions",
    missionType: "solo",
    focusDuration: 45,
    defaultLocation: "Hostel Desk / Library",
    tasks: [
      "Diagram thread race condition & mutex lock solution (15 min)",
      "Trace paging & LRU cache page fault replacement (15 min)",
      "Implement producer-consumer problem with semaphores (15 min)"
    ],
    coverColor: "#3b82f6",
    coverImage: "linear-gradient(135deg, #081735 0%, #050505 100%)",
    badge: "CORE OS"
  },
  {
    id: "cs-dbms-sql",
    title: "DBMS Engine: Indexing & Complex SQL Joins",
    shortTitle: "DBMS & SQL",
    description: "Deep dive into database internal mechanics: B+ Trees, query explain plans, normalization (1NF to BCNF), and ACID transaction isolations.",
    pillar: "Grind",
    groupTag: "Computer Science & Engineering",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 40,
    defaultLocation: "Campus Central Library",
    tasks: [
      "Write 5 multi-table INNER/LEFT joins with window functions (15 min)",
      "Analyze EXPLAIN ANALYZE index scan vs seq scan (15 min)",
      "Normalize unorganized schema up to 3NF/BCNF (10 min)"
    ],
    coverColor: "#0ea5e9",
    coverImage: "linear-gradient(135deg, #071f30 0%, #050505 100%)",
    badge: "SQL & DB"
  },
  {
    id: "cs-networks-trace",
    title: "Computer Networks: Handshakes & Packet Sniffing",
    shortTitle: "Networks Trace",
    description: "Wireshark packet inspection and protocol breakdown: TCP 3-way handshake, TLS 1.3 key exchange, DNS resolution hierarchy, and UDP vs TCP.",
    pillar: "Grind",
    groupTag: "Computer Science & Engineering",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 35,
    defaultLocation: "Tech Park",
    tasks: [
      "Capture & inspect TCP handshake in Wireshark/cURL (10 min)",
      "Trace DNS recursive lookup steps for a real domain (10 min)",
      "Compare HTTP/1.1 pipelining vs HTTP/2 multiplexing vs QUIC (15 min)"
    ],
    coverColor: "#10b981",
    coverImage: "linear-gradient(135deg, #062319 0%, #050505 100%)",
    badge: "NETWORKS"
  },
  {
    id: "system-design-teardown",
    title: "System Design: Scalable URL Shortener / Feed Engine",
    shortTitle: "System Design",
    description: "Designing a distributed system from first principles: capacity estimation, Redis cache layer, database sharding, and CDN edge termination.",
    pillar: "Grind",
    groupTag: "Computer Science & Engineering",
    categoryId: 16,
    categoryName: "Projects",
    missionType: "solo",
    focusDuration: 50,
    defaultLocation: "SRM KTR UB Block",
    tasks: [
      "Calculate QPS, storage bandwidth, and read/write ratio (15 min)",
      "Draft high-level architecture diagram with Redis & Postgres (20 min)",
      "Address single point of failure & cache eviction strategy (15 min)"
    ],
    coverColor: "#8b5cf6",
    coverImage: "linear-gradient(135deg, #1b0c33 0%, #050505 100%)",
    badge: "SYS DESIGN"
  },

  // ─── PILLAR: APP RESEARCH & INTERNET TRENDS ────────────────────────
  {
    id: "app-teardown-aura",
    title: "Viral App Breakdown: Aura & Consumer Gamification",
    shortTitle: "Aura Teardown",
    description: "Deconstruct what made apps like Aura, Strava, and Lapse explode on campus. Analyze first-minute onboarding friction, status gamification, and retention mechanics.",
    pillar: "Research",
    groupTag: "App Research & Internet Trends",
    categoryId: 10,
    categoryName: "Research",
    missionType: "solo",
    focusDuration: 40,
    defaultLocation: "Java Canteen / Room",
    tasks: [
      "Screen-record & map first-time user onboarding steps (15 min)",
      "Deconstruct core dopamine loop & status signaling mechanics (15 min)",
      "Write 3 key product takeaways applicable to campus products (10 min)"
    ],
    coverColor: "#ec4899",
    coverImage: "linear-gradient(135deg, #2b081c 0%, #050505 100%)",
    badge: "AURA APP"
  },
  {
    id: "api-reverse-engineer",
    title: "Network Reverse-Engineering: Hidden Endpoints & Auth",
    shortTitle: "API Reverse Eng",
    description: "Inspect network traffic of popular web applications via DevTools/Proxies. Uncover undocumented JSON payloads, authentication schemes, and rate limiting.",
    pillar: "Research",
    groupTag: "App Research & Internet Trends",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "solo",
    focusDuration: 45,
    defaultLocation: "Hostel Room",
    tasks: [
      "Inspect Network tab on target app & identify private endpoints (15 min)",
      "Replicate authorized API request in cURL or Postman (15 min)",
      "Document payload schema and auth session token handling (15 min)"
    ],
    coverColor: "#3b82f6",
    coverImage: "linear-gradient(135deg, #091a38 0%, #050505 100%)",
    badge: "DEVTOOLS"
  },
  {
    id: "internet-trends-radar",
    title: "Internet Trend Radar: GitHub Trending & Social Meta",
    shortTitle: "Trends Radar",
    description: "Audit current viral consumer narratives across Tech Twitter, TikTok/Reels, and GitHub Trending. Extract actionable mechanics for student distribution.",
    pillar: "Research",
    groupTag: "App Research & Internet Trends",
    categoryId: 7,
    categoryName: "Content Creation",
    missionType: "solo",
    focusDuration: 30,
    defaultLocation: "Anywhere",
    tasks: [
      "Audit top 5 trending open-source GitHub repos this week (10 min)",
      "Identify 3 dominant audio/video editing formats on Instagram (10 min)",
      "Draft 1 viral hook script or product meme format (10 min)"
    ],
    coverColor: "#f97316",
    coverImage: "linear-gradient(135deg, #2b1106 0%, #050505 100%)",
    badge: "TREND RADAR"
  },
  {
    id: "tactile-ui-prototype",
    title: "Tactile UI Prototype: Fluid Micro-Interactions",
    shortTitle: "Tactile UI Craft",
    description: "Build a luxury tactile interaction in Tailwind CSS & Framer Motion: metallic button press, spring physics sheet, or gesture swipe card.",
    pillar: "Research",
    groupTag: "App Research & Internet Trends",
    categoryId: 6,
    categoryName: "Design",
    missionType: "solo",
    focusDuration: 50,
    defaultLocation: "SRM KTR Tech Park",
    tasks: [
      "Design component state machine & spring physics curve (15 min)",
      "Code responsive dark-mode container with Tailwind (20 min)",
      "Tune Framer Motion tactile spring stiffness & damping (15 min)"
    ],
    coverColor: "#d946ef",
    coverImage: "linear-gradient(135deg, #26072b 0%, #050505 100%)",
    badge: "UI CRAFT"
  },

  // ─── PILLAR: SOCIAL & CAMPUS COLLABORATION ─────────────────────────
  {
    id: "srm-midnight-chai-code",
    title: "Midnight Chai & Code Review — Java Canteen",
    shortTitle: "Chai & Code",
    description: "Late night debugging session over hot cutting chai and Maggi at Java Canteen. Bring laptops, active pull requests, and tough compiler bugs to squash together.",
    pillar: "Social",
    groupTag: "Social & Collaboration",
    categoryId: 1,
    categoryName: "Coding",
    missionType: "group",
    focusDuration: 45,
    defaultLocation: "SRM KTR Java Canteen",
    tasks: [
      "Grab hot chai & table at Java Canteen (5 min)",
      "Walkthrough pending PR code logic and edge cases (25 min)",
      "Fix breaking tests, squash commits, and merge (15 min)"
    ],
    coverColor: "#f59e0b",
    coverImage: "linear-gradient(135deg, #281804 0%, #050505 100%)",
    badge: "CHAI & CODE"
  },
  {
    id: "resume-portfolio-roast",
    title: "Resume & GitHub Portfolio Brutal Roast",
    shortTitle: "Resume Roast",
    description: "Peer-review 2 technical resumes and GitHub profiles. Flag fluff, audit ATS keyword density, verify live project demos, and tighten bullet points.",
    pillar: "Social",
    groupTag: "Social & Collaboration",
    categoryId: 15,
    categoryName: "Career",
    missionType: "group",
    focusDuration: 35,
    defaultLocation: "Central Library",
    tasks: [
      "Audit resume layout against single-column ATS standards (10 min)",
      "Verify live project deployment links & GitHub README quality (15 min)",
      "Rewrite 3 weak bullet points using action-verb impact metrics (10 min)"
    ],
    coverColor: "#64748b",
    coverImage: "linear-gradient(135deg, #101621 0%, #050505 100%)",
    badge: "RESUME ROAST"
  }
];

export function getStarterQuestsByPillar(pillar?: string) {
  if (!pillar || pillar === "All") return STARTER_QUESTS;
  if (pillar === "Academics") return STARTER_QUESTS.filter((q) => q.pillar === "Academics");
  if (pillar === "CS Grind" || pillar === "Grind") return STARTER_QUESTS.filter((q) => q.pillar === "Grind");
  if (pillar === "App Research" || pillar === "Research") return STARTER_QUESTS.filter((q) => q.pillar === "Research");
  if (pillar === "Physical") return STARTER_QUESTS.filter((q) => q.pillar === "Physical");
  if (pillar === "Discipline") return STARTER_QUESTS.filter((q) => q.pillar === "Discipline");
  if (pillar === "Social") return STARTER_QUESTS.filter((q) => q.pillar === "Social");
  return STARTER_QUESTS.filter((q) => q.pillar === pillar);
}

export function getStarterQuestGroups(): { label: string; quests: StarterQuest[] }[] {
  const groupOrder = [
    "SRM & Campus Academics",
    "Computer Science & Engineering",
    "App Research & Internet Trends",
    "Physical & Vitality",
    "Discipline & Focus",
    "Social & Collaboration"
  ];

  const groups: { [key: string]: StarterQuest[] } = {};
  for (const label of groupOrder) {
    groups[label] = [];
  }

  for (const q of STARTER_QUESTS) {
    let tag = q.groupTag;
    if (!tag) {
      if (q.pillar === "Academics") tag = "SRM & Campus Academics";
      else if (q.pillar === "Research") tag = "App Research & Internet Trends";
      else if (q.pillar === "Physical") tag = "Physical & Vitality";
      else if (q.pillar === "Discipline") tag = "Discipline & Focus";
      else if (q.pillar === "Social") tag = "Social & Collaboration";
      else tag = "Computer Science & Engineering";
    }
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(q);
  }

  return groupOrder
    .filter((label) => groups[label] && groups[label].length > 0)
    .map((label) => ({ label, quests: groups[label] }));
}
