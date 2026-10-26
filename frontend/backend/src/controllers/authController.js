const prisma = require("../config/db");
const { isDbUnavailable } = require("../utils/dbFallback");

/**
 * GET /api/auth/check-domain
 * Query: { email: string }
 * Checks if email domain is allowed on this campus app.
 */
async function checkDomain(req, res) {
  const { email } = req.query;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid student email is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  try {
    let college = null;
    let campuses = [];

    // Special priority handling for SRMIST domains to prioritize KTR
    if (domain === "srmist.edu.in") {
      college = await prisma.college.findFirst({
        where: {
          emailDomain: "srmist.edu.in",
          OR: [
            { shortName: { contains: "KTR", mode: "insensitive" } },
            { collegeName: { contains: "Kattankulathur", mode: "insensitive" } }
          ]
        }
      });
      const srmCampuses = await prisma.college.findMany({
        where: { emailDomain: "srmist.edu.in" }
      });
      campuses = srmCampuses.sort((a, b) => {
        if (a.shortName.includes("KTR")) return -1;
        if (b.shortName.includes("KTR")) return 1;
        return a.shortName.localeCompare(b.shortName);
      });
    }

    if (!college) {
      college = await prisma.college.findFirst({
        where: { emailDomain: domain }
      });
      if (college) {
        campuses = await prisma.college.findMany({
          where: { emailDomain: domain }
        });
      }
    }

    if (!college) {
      const parts = domain.split(".");
      if (parts.length > 2) {
        const baseDomain = parts.slice(1).join(".");
        college = await prisma.college.findFirst({
          where: { emailDomain: baseDomain }
        });
        if (college) {
          campuses = await prisma.college.findMany({
            where: { emailDomain: baseDomain }
          });
        }
      }
    }

    if (!college) {
      return res.status(400).json({
        error: "Only student email addresses from supported colleges are allowed."
      });
    }

    res.json({
      success: true,
      college: {
        id: college.id,
        name: college.shortName,
        full_name: college.collegeName,
        college_type: college.collegeType
      },
      campuses: campuses.map((c) => ({
        id: c.id,
        name: c.shortName,
        full_name: c.collegeName,
        city: c.city
      }))
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(500).json({ error: "Failed to check domain." });
  }
}

/**
 * POST /api/auth/profile
 * Syncs the verified Supabase user profile in our database.
 * Creates a skeleton profile for first-time signups.
 */
/**
 * POST /api/auth/profile
 * Creates the database profile for a verified Supabase user on first sign-in.
 * Identity (auth id + email) comes only from the verified session that
 * getAuthUser() attached; linking by email already happened there, and only
 * for unlinked rows.
 */
async function syncProfile(req, res) {
  const session = req.supabaseUser;
  if (!session || !session.email) return res.status(401).json({ error: "Not authenticated." });

  let user = req.user;
  if (!user) {
    const domain = session.email.split("@")[1] || "";
    let college = await prisma.college.findFirst({ where: { emailDomain: domain } });
    if (!college && domain.split(".").length > 2) {
      college = await prisma.college.findFirst({ where: { emailDomain: domain.split(".").slice(1).join(".") } });
    }
    try {
      user = await prisma.user.create({
        data: {
          supabaseId: session.id,
          name: session.email.split("@")[0].slice(0, 50),
          email: session.email,
          emailVerified: true,
          verifiedAt: new Date(),
          college: college ? college.shortName : null,
          collegeId: college ? college.id : null,
          reputationScore: 100
        }
      });
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "This email is linked to another account." });
      throw error;
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username || null,
      email: user.email,
      email_verified: user.emailVerified,
      college: user.college,
      department: user.department,
      reputation_score: user.reputationScore,
      bio: user.bio,
      instagram: user.instagram,
      github: user.github,
      interests: user.interests
    }
  });
}

/**
 * GET /api/auth/me
 * The signed-in user's own profile, or { incomplete: true } before onboarding.
 */
async function getMe(req, res) {
  const session = req.supabaseUser;
  if (!session) return res.status(401).json({ error: "Not authenticated." });

  const dbUser = req.user;
  if (!dbUser) {
    return res.json({ incomplete: true, email: session.email, name: (session.email || "").split("@")[0] });
  }

  res.json({
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username || null,
    email: dbUser.email,
    email_verified: dbUser.emailVerified,
    college: dbUser.college,
    college_id: dbUser.email, // legacy field name the UI expects
    department: dbUser.department,
    reputation_score: dbUser.reputationScore,
    location: dbUser.location,
    bio: dbUser.bio,
    instagram: dbUser.instagram,
    github: dbUser.github,
    interests: dbUser.interests,
    campus_id: dbUser.collegeId,
    campus_name: dbUser.collegeRef?.shortName || "",
    verified_at: dbUser.verifiedAt,
    avatar_url: dbUser.avatarUrl || null
  });
}

async function logout(req, res) {
  res.json({ success: true, message: "Logged out." });
}

module.exports = {
  checkDomain,
  syncProfile,
  getMe,
  logout
};
