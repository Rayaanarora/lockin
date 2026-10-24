export interface StarterQuest {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  pillar: "Physical" | "Grind" | "Discipline" | "Social";
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
  }
];

export function getStarterQuestsByPillar(pillar?: string) {
  if (!pillar || pillar === "All") return STARTER_QUESTS;
  return STARTER_QUESTS.filter((q) => q.pillar === pillar);
}
