const prisma = require("../src/config/db");

async function seedSideQuests() {
  console.log("Seeding 20 Master Side Quests for LOCKIN...");

  // Find host users
  const hosts = await prisma.user.findMany({
    take: 10,
    orderBy: { id: "asc" }
  });

  if (hosts.length === 0) {
    console.error("No users found to host missions.");
    process.exit(1);
  }

  const defaultHost = hosts[0];
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const quests = [
    // 1. Run 5km
    {
      title: "6:00 AM Campus Sunrise Run",
      description: "5km paced campus loop. Beat the morning heat, clear brain fog, and build athletic stamina before lectures.",
      location: "Campus Track / Grounds",
      datetime: new Date(now + 6 * hour),
      categoryId: 8, // Fitness
      focusDuration: 35,
      tasks: ["Dynamic warm-up & hamstring stretches", "5.0 km continuous steady-state run", "Cool-down walk & 500ml rehydration"]
    },
    // 2. Clean Room
    {
      title: "Clean Room & Workspace — Environment Reset",
      description: "Physical chaos creates cognitive drag. Make bed with tight corners, wipe desk surface, bin clutter, and vacuum floor.",
      location: "Hostel / Apartment",
      datetime: new Date(now + 8 * hour),
      categoryId: 19, // Other
      focusDuration: 25,
      tasks: ["Make bed tight & stow pillows cleanly", "Clear desk down to monitor and notebook", "Discard trash & empty cups", "Fold clean clothes"]
    },
    // 3. Deep Work 60m
    {
      title: "Deep Work Sprint (60 Min Airplane Mode)",
      description: "Full lock-in on one high-leverage task. Phone on do-not-disturb, single window maximized, uninterrupted cognitive flow.",
      location: "Library Quiet Zone",
      datetime: new Date(now + 12 * hour),
      categoryId: 1, // Coding
      focusDuration: 60,
      tasks: ["Select single core task & close unrelated apps", "60-minute uninterrupted focus timer", "Document output snapshot & commit changes"]
    },
    // 4. Midnight Chai & Code
    {
      title: "Midnight Chai & Code Review",
      description: "Late night debugging session over hot cutting chai and Maggi at Java Canteen. Bring laptops, active pull requests, and tough compiler bugs.",
      location: "Campus Java Canteen",
      datetime: new Date(now + 16 * hour),
      categoryId: 1, // Coding
      focusDuration: 45,
      tasks: ["Order hot chai and assemble laptops", "Walk through PR architecture & tricky bugs", "Benchmark test coverage and merge clean code"]
    },
    // 5. 100 Pushups
    {
      title: "100 Pushups — Upper Body Grit Trial",
      description: "4 clean sets of 25 pushups with strict chest-to-deck form. High muscle recruitment, zero equipment needed, pure activation.",
      location: "Hostel Room / Gym",
      datetime: new Date(now + 20 * hour),
      categoryId: 8, // Fitness
      focusDuration: 20,
      tasks: ["Wrist & shoulder warmup rotations", "Set 1 & 2: 25 strict standard pushups", "Set 3 & 4: 25 controlled pushups", "3-minute doorframe stretch"]
    },
    // 6. Cold Shower
    {
      title: "Cold Shower 3 Min — Shock Baseline Reset",
      description: "3 minutes at full cold tap. Forces deep diaphragmatic breathing, spikes natural dopamine, and eliminates morning lethargy.",
      location: "Hostel Washroom",
      datetime: new Date(now + 1 * day),
      categoryId: 8, // Fitness
      focusDuration: 15,
      tasks: ["30s deep box breathing before entering", "Direct cold water immersion (chest & neck)", "Control breathing for 3 full minutes", "Vigorous towel dry"]
    },
    // 7. LeetCode Trio
    {
      title: "LeetCode Trio — 3 Mediums Zero Hints",
      description: "Solve 3 graph, dynamic programming, or sliding window problems without opening solutions. Dry-run edge cases manually first.",
      location: "Library / Hostel Desk",
      datetime: new Date(now + 1 * day + 4 * hour),
      categoryId: 12, // Comp Prog
      focusDuration: 75,
      tasks: ["Problem 1: Trees / Graph Traversal (DFS/BFS)", "Problem 2: Two Pointers or Sliding Window", "Problem 3: DP Subarray or Matrix Path", "Analyze time & space complexities"]
    },
    // 8. Read 20 Pages
    {
      title: "Read 20 Pages — High-Signal Non-Fiction",
      description: "Read 20 pages of engineering, biography, or philosophy. Highlight key insights and write a 1-sentence mental takeaway.",
      location: "Quiet Spot / Balcony",
      datetime: new Date(now + 1 * day + 8 * hour),
      categoryId: 13, // Reading
      focusDuration: 30,
      tasks: ["Read 20 continuous pages without skimming", "Annotate top 3 memorable passages", "Write 1-sentence synthesis in personal notes"]
    },
    // 9. Digital Declutter
    {
      title: "Digital Declutter — Desktop & Tab Zero",
      description: "Close 30+ browser tabs, empty Downloads folder, organize messy code repos, and wipe phone home screen of distracting badges.",
      location: "Workstation",
      datetime: new Date(now + 2 * day),
      categoryId: 19, // Other
      focusDuration: 20,
      tasks: ["Bookmark or close tabs older than 24h", "Empty Downloads folder to 0 items", "Git prune stale local branches", "Mute non-essential notifications"]
    },
    // 10. Ship 1 Feature
    {
      title: "Ship 1 Live Feature — Commit to Production",
      description: "Stop endless refactoring. Polish one functional component or API route, write sanity tests, deploy live.",
      location: "Tech Park / Workstation",
      datetime: new Date(now + 2 * day + 6 * hour),
      categoryId: 1, // Coding
      focusDuration: 90,
      tasks: ["Scope smallest shippable improvement", "Code & test edge cases locally", "Create PR, merge, and verify live on production build"]
    },
    // 11. 15-Min Sunlight Walk
    {
      title: "15-Min Sunlight Walk — Circadian Reboot",
      description: "Direct morning sunlight exposure within 45 minutes of waking. Natural photons set your sleep timer and elevate daytime alert state.",
      location: "Campus Courtyard",
      datetime: new Date(now + 3 * day),
      categoryId: 8, // Fitness
      focusDuration: 20,
      tasks: ["Leave sunglasses and phone inside pockets", "Brisk 15-minute natural sunlight walk", "Drink 1 tall glass of water with mineral salt"]
    },
    // 12. Library 2h Lock-In
    {
      title: "Library 2-Hour Lock-In — Syllabus Crush",
      description: "Two 50-minute study blocks with 10-minute quiet stretch. Clear an entire unit of technical syllabus or research papers.",
      location: "Campus Central Library 2nd Floor",
      datetime: new Date(now + 3 * day + 4 * hour),
      categoryId: 9, // Study Sessions
      focusDuration: 110,
      tasks: ["Block 1: Deep concept reading & note extraction", "10-min eye rest away from screens", "Block 2: Solve 5 past exam problems", "Summarize cheat sheet into 1 index card"]
    },
    // 13. Zero Doomscrolling
    {
      title: "Zero Doomscrolling — 12-Hour Feed Fast",
      description: "Zero TikTok, Reels, or infinite algorithmic feeds for the entire day. Reclaim 90+ minutes of lost attention span.",
      location: "Everywhere",
      datetime: new Date(now + 3 * day + 10 * hour),
      categoryId: 19, // Other
      focusDuration: 60,
      tasks: ["Set app limits or move feed apps to hidden folder", "Replace feed urges with 10 deep breaths", "Log end-of-day screen time under 2.5 hours total"]
    },
    // 14. Night Blueprint
    {
      title: "Night Blueprint — Tomorrow Planned in 10 Min",
      description: "Never wake up wondering what to do. Lay out clothes, pack your bag, and lock in top 3 non-negotiables before sleep.",
      location: "Desk / Bedside",
      datetime: new Date(now + 4 * day),
      categoryId: 19, // Other
      focusDuration: 15,
      tasks: ["Write down 3 non-negotiable tasks for tomorrow", "Pack bag with charged laptop and notebook", "Charge phone 5 feet away from bed"]
    },
    // 15. 24h Sugar Fast
    {
      title: "24h Sugar Fast — Metabolic Reset Trial",
      description: "24 hours without sodas, packaged juices, pastries, or sweet chai. Stabilize insulin spikes and eradicate brain fog.",
      location: "Campus Canteen & Mess",
      datetime: new Date(now + 4 * day + 6 * hour),
      categoryId: 8, // Fitness
      focusDuration: 45,
      tasks: ["Drink black coffee or green tea instead of sweet drinks", "Choose whole meals: eggs, paneer, chicken, or lentils", "Zero desserts or biscuits post-dinner"]
    },
    // 16. Campus Build Duo
    {
      title: "Campus Build Duo — Silent Co-Working",
      description: "Find a builder peer in library or student lounge. Commit to 90 minutes of parallel work with mutual accountability.",
      location: "Library Reading Hall",
      datetime: new Date(now + 5 * day),
      categoryId: 9, // Study Sessions
      focusDuration: 90,
      tasks: ["Share target goal before starting timer", "Silent 90-minute parallel grind block", "Debrief outcomes and celebrate progress together"]
    },
    // 17. 3L Hydration & Mobility
    {
      title: "3L Hydration & Full Spine Decompress",
      description: "Rehydrate the nervous system and unlock tight hip flexors and lower back from hours in lecture hall chairs.",
      location: "Anywhere",
      datetime: new Date(now + 5 * day + 6 * hour),
      categoryId: 8, // Fitness
      focusDuration: 25,
      tasks: ["Consume 1L water with morning electrolyte", "Couch stretch (2 min per side)", "Cat-cow & thoracic extensions (10 reps)", "Deep resting squat hold (3 min)"]
    },
    // 18. Inbox Zero
    {
      title: "Inbox Zero — Backlog Annihilation",
      description: "Reply to unanswered college emails, clear pending WhatsApp group notices, and archive resolved tickets to achieve zero pending items.",
      location: "Desk",
      datetime: new Date(now + 6 * day),
      categoryId: 19, // Other
      focusDuration: 25,
      tasks: ["Process college inbox down to 0 unread messages", "Confirm assignment & lab schedule deadlines", "Archive dead threads and mute noise groups"]
    },
    // 19. Builder Outreach
    {
      title: "Builder Outreach — Connect with 1 Senior or Mentor",
      description: "Write a personalized, concise message to a senior engineer, alumni, or founder whose work you respect. Ask for specific feedback.",
      location: "Workstation / LinkedIn",
      datetime: new Date(now + 6 * day + 6 * hour),
      categoryId: 17, // Networking
      focusDuration: 25,
      tasks: ["Research their recent project or post", "Draft 3-sentence message with genuine appreciation and 1 clear ask", "Send and log follow-up date"]
    },
    // 20. Breathwork Calm
    {
      title: "10-Min Box Breathwork — Calm Under Pressure",
      description: "4-4-4-4 box breathing pattern (inhale 4s, hold 4s, exhale 4s, hold 4s). Downregulates sympathetic nervous system and sharpens executive focus.",
      location: "Quiet Corner",
      datetime: new Date(now + 7 * day),
      categoryId: 8, // Fitness
      focusDuration: 15,
      tasks: ["Sit upright with spine straight and eyes closed", "Perform 12 complete cycles of box breathing", "Notice mental stillness before returning to work"]
    }
  ];

  console.log(`Processing ${quests.length} master side quests...`);

  for (let i = 0; i < quests.length; i++) {
    const q = quests[i];
    const hostUser = hosts[i % hosts.length] || defaultHost;

    // Check if mission already exists by title
    const existing = await prisma.mission.findFirst({
      where: { title: q.title }
    });

    if (existing) {
      await prisma.mission.update({
        where: { id: existing.id },
        data: {
          datetime: q.datetime,
          description: q.description,
          location: q.location,
          focusDuration: q.focusDuration,
          collegeRef: { disconnect: true },
          category: { connect: { id: q.categoryId } }
        }
      });
      console.log(`[UPDATED] ${q.title} (ID: ${existing.id})`);
    } else {
      const created = await prisma.mission.create({
        data: {
          title: q.title,
          description: q.description,
          location: q.location,
          datetime: q.datetime,
          missionType: "group",
          focusDuration: q.focusDuration,
          category: { connect: { id: q.categoryId } },
          creator: { connect: { id: hostUser.id } }
        }
      });

      if (q.tasks && q.tasks.length > 0) {
        await prisma.task.createMany({
          data: q.tasks.map((t, idx) => ({
            title: t,
            position: idx,
            missionId: created.id
          }))
        });
      }
      console.log(`[CREATED] ${q.title} (ID: ${created.id})`);
    }
  }

  console.log("Successfully seeded 20 Master Side Quests for LOCKIN!");
  process.exit(0);
}

seedSideQuests().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
