const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean DB
  await prisma.message.deleteMany({});
  await prisma.participation.deleteMany({});
  await prisma.mission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.campus.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.skill.deleteMany({});

  // Seed Campuses
  const campuses = await prisma.campus.createManyAndReturn({
    data: [
      { id: 1, name: "SRM IST, Kattankulathur (KTR)", location: "Chennai, TN" },
      { id: 2, name: "SRM IST, Ramapuram", location: "Chennai, TN" },
      { id: 3, name: "SRM IST, Vadapalani", location: "Chennai, TN" },
      { id: 4, name: "VIT University, Vellore", location: "Vellore, TN" },
      { id: 5, name: "VIT University, Chennai", location: "Chennai, TN" },
      { id: 6, name: "IIT Madras", location: "Chennai, TN" },
      { id: 7, name: "IIT Bombay", location: "Mumbai, MH" },
      { id: 8, name: "IIT Delhi", location: "Delhi, DL" },
      { id: 9, name: "NIT Trichy", location: "Trichy, TN" },
      { id: 10, name: "BITS Pilani, Pilani Campus", location: "Pilani, RJ" },
      { id: 11, name: "BITS Pilani, Goa Campus", location: "Zuarinagar, GA" },
      { id: 12, name: "BITS Pilani, Hyderabad Campus", location: "Hyderabad, TS" }
    ]
  });

  // Seed Categories
  await prisma.category.createMany({
    data: [
      { id: 1, categoryName: "Coding" },
      { id: 2, categoryName: "Sports" },
      { id: 3, categoryName: "Study" },
      { id: 4, categoryName: "Design" },
      { id: 5, categoryName: "Gaming" },
      { id: 6, categoryName: "Fitness" },
      { id: 7, categoryName: "Other" }
    ]
  });

  // Seed Skills
  await prisma.skill.createMany({
    data: [
      { id: 1, skillName: "JavaScript", verificationSource: "GitHub" },
      { id: 2, skillName: "React", verificationSource: "Project Portfolio" },
      { id: 3, skillName: "MySQL", verificationSource: "DBMS Lab" },
      { id: 4, skillName: "Node.js", verificationSource: "GitHub" },
      { id: 5, skillName: "UI Design", verificationSource: "Portfolio" }
    ]
  });

  // Seed Users linked to SRM KTR Campus (id: 1)
  await prisma.user.createMany({
    data: [
      { id: 101, name: "Faheem", email: "faheem@srmist.edu.in", department: "Networking and Communications", reputationScore: 80, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Library", campusId: 1, bio: "Building LOCKIN app. Let's meet up and execute.", instagram: "@faheem_comm", github: "faheem-git", interests: "Coding,Design,Other" },
      { id: 102, name: "Rayaan", email: "rayaan@srmist.edu.in", department: "Networking and Communications", reputationScore: 90, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Tech Park", campusId: 1, bio: "Designing runways. Zero chatter, pure focus.", instagram: "@rayaan_arora", github: "rayaan-git", interests: "Coding,Design" },
      { id: 103, name: "Aarav Mehta", email: "aarav@srmist.edu.in", department: "Computer Science Engineering", reputationScore: 40, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Main Campus", campusId: 1, bio: "Algorithms enthusiast.", instagram: "@aarav_mehta", github: "aarav-codes", interests: "Coding,Study" },
      { id: 104, name: "Maya Rao", email: "maya@srmist.edu.in", department: "Information Technology", reputationScore: 55, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Library", campusId: 1, bio: "Full stack builder.", instagram: "@maya_builds", github: "maya-rao", interests: "Coding,Design" },
      { id: 105, name: "Kabir Sethi", email: "kabir@srmist.edu.in", department: "Computer Science Engineering", reputationScore: 15, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Hostel A", campusId: 1, bio: "Gamer & Developer.", instagram: "@kabir_sethi", github: "kabir-git", interests: "Coding,Gaming" },
      { id: 106, name: "Ira Thomas", email: "ira@srmist.edu.in", department: "Electronics and Communication", reputationScore: 25, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Innovation Centre", campusId: 1, bio: "IoT research lead.", instagram: "@ira_thomas", github: "ira-iot", interests: "Coding,Study" },
      { id: 107, name: "Dev Nair", email: "dev@srmist.edu.in", department: "Computer Science Engineering", reputationScore: 70, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Sports Complex", campusId: 1, bio: "Athlete & Hacker.", instagram: "@dev_hacks", github: "dev-nair", interests: "Sports,Fitness,Coding" },
      { id: 108, name: "Nisha Khan", email: "nisha@srmist.edu.in", department: "Data Science", reputationScore: 80, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Cafe Court", campusId: 1, bio: "Analyzing vibe patterns.", instagram: "@nisha_khan", github: "nisha-data", interests: "Coding,Study" },
      { id: 109, name: "Rohan Das", email: "rohan@srmist.edu.in", department: "Artificial Intelligence", reputationScore: 35, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Seminar Hall", campusId: 1, bio: "Deep learning builder.", instagram: "@rohan_das", github: "rohan-ai", interests: "Coding,Study" },
      { id: 110, name: "Tara Iyer", email: "tara@srmist.edu.in", department: "Data Science", reputationScore: 45, college: "SRM IST, Kattankulathur (KTR)", location: "SRM KTR Library", campusId: 1, bio: "Clean UI enthusiast.", instagram: "@tara_iyer", github: "tara-design", interests: "Design,Study" }
    ]
  });

  const now = new Date();

  // Helper to add hours
  const addHours = (date, h) => {
    const d = new Date(date);
    d.setTime(d.getTime() + h * 60 * 60 * 1000);
    return d;
  };

  // Seed Missions
  await prisma.mission.createMany({
    data: [
      { id: 201, title: "Hackathon Grind", description: "All-night coding session to build the MVP. Bring caffeine.", datetime: addHours(now, 4), location: "SRM KTR Library", categoryId: 1, createdBy: 101, campusId: 1, focusDuration: 45, verificationCode: "2011" },
      { id: 202, title: "LeetCode Lock-In", description: "Solving 5 hard/medium problems on arrays and graphs.", datetime: addHours(now, 7), location: "SRM KTR Tech Park", categoryId: 1, createdBy: 102, campusId: 1, focusDuration: 25, verificationCode: "2022" },
      { id: 203, title: "API Battle Test", description: "Load testing express endpoints and optimizing performance.", datetime: addHours(now, 24), location: "SRM KTR Computer Lab 2", categoryId: 1, createdBy: 103, campusId: 1, focusDuration: 60, verificationCode: "2033" },
      { id: 204, title: "Pitch Deck Build", description: "Design pitch slides and polish the demo script.", datetime: addHours(now, 24), location: "SRM KTR Seminar Hall", categoryId: 1, createdBy: 104, campusId: 1, focusDuration: 15, verificationCode: "2044" },
      { id: 205, title: "Database Schema Jam", description: "Designing optimal relational tables and indexes.", datetime: addHours(now, 48), location: "SRM KTR DBMS Lab", categoryId: 1, createdBy: 105, campusId: 1, focusDuration: 25, verificationCode: "2055" },
      { id: 206, title: "Open Source Fix Run", description: "Squashing open bugs in our target repo. Let's contribute.", datetime: addHours(now, 48), location: "SRM KTR Innovation Centre", categoryId: 1, createdBy: 106, campusId: 1, focusDuration: 25, verificationCode: "2066" },
      { id: 207, title: "DSA Mock Duel", description: "1v1 mock interview sessions on tree traversal.", datetime: addHours(now, 72), location: "SRM KTR Block C", categoryId: 1, createdBy: 107, campusId: 1, focusDuration: 25, verificationCode: "2077" },
      { id: 208, title: "Frontend Polish Night", description: "Adding Framer Motion micro-animations to improve UI feel.", datetime: addHours(now, 72), location: "SRM KTR Design Studio", categoryId: 1, createdBy: 108, campusId: 1, focusDuration: 25, verificationCode: "2088" },
      { id: 209, title: "Backend Deploy Squad", description: "Setting up docker and deploying Express services.", datetime: addHours(now, 96), location: "SRM KTR Networking Lab", categoryId: 1, createdBy: 109, campusId: 1, focusDuration: 25, verificationCode: "2099" },
      { id: 210, title: "Final Demo Rehearsal", description: "Simulating public presentation and timing of slides.", datetime: addHours(now, 120), location: "SRM KTR Auditorium Lobby", categoryId: 1, createdBy: 110, campusId: 1, focusDuration: 25, verificationCode: "2100" }
    ]
  });

  // Seed Participations
  await prisma.participation.createMany({
    data: [
      { id: 301, userId: 102, missionId: 201, status: "Completed", showedUp: true },
      { id: 302, userId: 101, missionId: 202, status: "Accepted", showedUp: null },
      { id: 303, userId: 107, missionId: 203, status: "Completed", showedUp: true },
      { id: 304, userId: 108, missionId: 204, status: "Missed", showedUp: false }
    ]
  });

  // Seed Messages
  await prisma.message.createMany({
    data: [
      { id: 1, missionId: 201, senderId: 102, message: "Locked in. I will bring the DBMS report queries." },
      { id: 2, missionId: 202, senderId: 101, message: "I am taking arrays and graphs first." }
    ]
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
