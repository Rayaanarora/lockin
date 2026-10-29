const prisma = require("../src/config/db");

async function seedSideQuests() {
  const ktr = await prisma.college.findFirst({ where: { shortName: "SRM KTR" } });
  if (!ktr) {
    console.error("SRM KTR college not found!");
    process.exit(1);
  }

  // Find host users
  const hosts = await prisma.user.findMany({
    where: { collegeId: ktr.id },
    take: 6
  });

  const defaultHost = hosts[0] || (await prisma.user.findFirst());
  if (!defaultHost) {
    console.error("No users found to host missions.");
    process.exit(1);
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const quests = [
    {
      title: "6:00 AM Campus Sunrise Run",
      description: "5km morning loop around SRM Clock Tower and Tech Park grounds. Beat the Chennai humidity, clear the brain fog, and build athletic stamina before morning lectures.",
      location: "SRM KTR Track Grounds",
      datetime: new Date(now + 12 * 60 * 60 * 1000), // ~12 hours from now
      categoryId: 8, // Fitness
      collegeId: ktr.id,
      creatorId: hosts[1]?.id || defaultHost.id,
      tasks: ["Warm-up & dynamic stretches", "5KM paced campus loop", "Cool-down & hydration checkpoint"]
    },
    {
      title: "Midnight Chai & Code Review",
      description: "Late night debugging session over hot cutting chai and Maggi at Java Canteen. Bring laptops, active pull requests, and tough compiler bugs to squash together.",
      location: "SRM KTR Java Canteen",
      datetime: new Date(now + 18 * 60 * 60 * 1000), // tonight
      categoryId: 1, // Coding
      collegeId: ktr.id,
      creatorId: hosts[2]?.id || defaultHost.id,
      tasks: ["Order cutting chai & Maggi", "Walkthrough PR architecture", "Fix failing tests & merge"]
    },
    {
      title: "Night Owl Ship Sprint (0 to 1 Build)",
      description: "3-hour deep focus block. No YouTube, no endless scrolling. Turn your weekend prototype into a shipped V1 live on Vercel with clean API endpoints.",
      location: "SRM KTR Tech Park 5th Floor",
      datetime: new Date(now + 1 * day),
      categoryId: 4, // Hackathons
      collegeId: ktr.id,
      creatorId: hosts[3]?.id || defaultHost.id,
      tasks: ["Define MVP feature scope", "Implement core user loop", "Deploy to Vercel & test live"]
    },
    {
      title: "LeetCode 75: Trees & Graphs Grind",
      description: "Tackling 4 Medium/Hard graph traversal and dynamic programming patterns. Whiteboarding state transitions and testing edge cases with peers.",
      location: "SRM KTR Central Library 2nd Floor",
      datetime: new Date(now + 2 * day),
      categoryId: 12, // Competitive Programming
      collegeId: ktr.id,
      creatorId: hosts[0]?.id || defaultHost.id,
      tasks: ["Binary Tree Right Side View", "Course Schedule (Topological Sort)", "Longest Increasing Path in Matrix", "Review space-time complexity"]
    },
    {
      title: "UI/UX Micro-Interactions Jam",
      description: "Figma to Framer Motion sprint. Refining spring physics, glassmorphic HUDs, dark-mode contrast, and tactile micro-animations for campus products.",
      location: "SRM KTR UB Block Study Lounge",
      datetime: new Date(now + 3 * day),
      categoryId: 6, // Design
      collegeId: ktr.id,
      creatorId: hosts[4]?.id || defaultHost.id,
      tasks: ["Audit current component layout", "Build tactile spring animations in Framer", "Mobile responsive test on devices"]
    },
    {
      title: "Weekend Breakout: Hill Trail Trek",
      description: "Early morning hike to the scenic hill trails behind campus. Fresh air, panoramic sunrise views, photography, and building bonds outside lecture halls.",
      location: "SRM KTR Main Arch Gate",
      datetime: new Date(now + 4 * day),
      categoryId: 18, // Events
      collegeId: ktr.id,
      creatorId: hosts[5]?.id || defaultHost.id,
      tasks: ["Assemble at Main Gate (6 AM)", "Ascent to summit viewpoint", "Summit group snapshot & breakfast"]
    },
    {
      title: "Cycle Test (CT) 2-Unit Crunch — High-Yield Lock-In",
      description: "50-minute focused revision of 2 high-yield units. Past 3 years questions, derivation summaries, formula cheat sheets. Zero phones.",
      location: "SRM KTR Central Library 2nd Floor",
      datetime: new Date(now + 14 * 60 * 60 * 1000),
      categoryId: 9, // Study Sessions
      collegeId: ktr.id,
      creatorId: hosts[0]?.id || defaultHost.id,
      tasks: ["Summarize Unit 1 key theorems & derivations (20 min)", "Solve 3 previous year CT question papers (20 min)", "Blind recall self-quiz on Unit 2 edge cases (10 min)"]
    },
    {
      title: "Lab FAT & Viva Code Sprint — Raw Terminal Trial",
      description: "Simulate the strict lab exam environment. Write and debug C++/Java/Python algorithms from scratch in raw terminal with zero AI autocompletion.",
      location: "SRM KTR Tech Park Lab 3",
      datetime: new Date(now + 26 * 60 * 60 * 1000),
      categoryId: 1, // Coding
      collegeId: ktr.id,
      creatorId: hosts[1]?.id || defaultHost.id,
      tasks: ["Implement primary lab exercise on raw compiler (20 min)", "Debug segmentation faults & memory edge cases (15 min)", "Oral defense / viva rapid-fire recall (10 min)"]
    },
    {
      title: "Placement OA Mock — 60-Minute Timed Test",
      description: "Timed campus recruitment test simulation (TCS/CTS/Amazon patterns). 2 medium DSA problems, 10 core CS questions, strict 60m timer.",
      location: "SRM KTR Tech Park 5th Floor",
      datetime: new Date(now + 2 * day),
      categoryId: 11, // Placements
      collegeId: ktr.id,
      creatorId: hosts[2]?.id || defaultHost.id,
      tasks: ["Solve DSA Problem 1: Array/Map pattern in 20 min", "Solve DSA Problem 2: Tree/Graph BFS in 25 min", "Review 10 Core CS aptitude & OS/DBMS MCQs (15 min)"]
    },
    {
      title: "Viral App Breakdown: Aura & Consumer Gamification",
      description: "Deconstruct what made apps like Aura, Strava, and Lapse explode on campus. Analyze first-minute onboarding friction, status gamification, and retention mechanics.",
      location: "SRM KTR Java Canteen",
      datetime: new Date(now + 30 * 60 * 60 * 1000),
      categoryId: 10, // Research
      collegeId: ktr.id,
      creatorId: hosts[3]?.id || defaultHost.id,
      tasks: ["Screen-record & map first-time user onboarding steps (15 min)", "Deconstruct core dopamine loop & status signaling mechanics (15 min)", "Write 3 key product takeaways applicable to campus products (10 min)"]
    },
    {
      title: "System Design: Scalable URL Shortener / Feed Engine",
      description: "Designing a distributed system from first principles: capacity estimation, Redis cache layer, database sharding, and CDN edge termination.",
      location: "SRM KTR UB Block Study Lounge",
      datetime: new Date(now + 3 * day),
      categoryId: 16, // Projects
      collegeId: ktr.id,
      creatorId: hosts[4]?.id || defaultHost.id,
      tasks: ["Calculate QPS, storage bandwidth, and read/write ratio (15 min)", "Draft high-level architecture diagram with Redis & Postgres (20 min)", "Address single point of failure & cache eviction strategy (15 min)"]
    },
    {
      title: "Resume & GitHub Portfolio Brutal Roast",
      description: "Peer-review 2 technical resumes and GitHub profiles. Flag fluff, audit ATS keyword density, verify live project demos, and tighten bullet points.",
      location: "SRM KTR Central Library",
      datetime: new Date(now + 4 * day),
      categoryId: 15, // Career
      collegeId: ktr.id,
      creatorId: hosts[5]?.id || defaultHost.id,
      tasks: ["Audit resume layout against single-column ATS standards (10 min)", "Verify live project deployment links & GitHub README quality (15 min)", "Rewrite 3 weak bullet points using action-verb impact metrics (10 min)"]
    }
  ];

  console.log(`Seeding ${quests.length} pre-added side quest missions for college ${ktr.shortName} (ID: ${ktr.id})...`);

  for (const q of quests) {
    const existing = await prisma.mission.findFirst({
      where: { title: q.title, collegeId: q.collegeId }
    });

    if (existing) {
      await prisma.mission.update({
        where: { id: existing.id },
        data: {
          datetime: q.datetime,
          description: q.description,
          location: q.location,
          category: { connect: { id: q.categoryId } }
        }
      });
      console.log(`Updated mission: ${q.title}`);
    } else {
      const created = await prisma.mission.create({
        data: {
          title: q.title,
          description: q.description,
          location: q.location,
          datetime: q.datetime,
          missionType: "group",
          category: { connect: { id: q.categoryId } },
          collegeRef: { connect: { id: q.collegeId } },
          creator: { connect: { id: q.creatorId } },
          focusDuration: 30
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
      console.log(`Created mission: ${q.title} (ID: ${created.id})`);
    }
  }

  console.log("Side quest missions successfully seeded!");
  process.exit(0);
}

seedSideQuests().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
