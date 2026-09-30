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
async function syncProfile(req, res) {
  if (!req.supabaseUser) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const email = req.supabaseUser.email;
  const supabaseId = req.supabaseUser.id;

  try {
    // Find existing user by supabaseId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { supabaseId: supabaseId },
          { email: email }
        ]
      }
    });

    const domain = email.trim().toLowerCase().split("@")[1];
    let college = await prisma.college.findFirst({
      where: { emailDomain: domain }
    });

    if (!college) {
      const parts = domain.split(".");
      if (parts.length > 2) {
        const baseDomain = parts.slice(1).join(".");
        college = await prisma.college.findFirst({
          where: { emailDomain: baseDomain }
        });
      }
    }

    if (!user) {
      // Create new skeleton database profile
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseId,
          name: email.split("@")[0],
          email: email,
          emailVerified: true,
          verifiedAt: new Date(),
          college: college ? college.shortName : null,
          collegeId: college ? college.id : null,
          reputationScore: 100
        }
      });
    } else {
      const updateData = {};
      if (!user.supabaseId) {
        updateData.supabaseId = supabaseId;
        updateData.emailVerified = true;
        updateData.verifiedAt = new Date();
      }
      if (!user.collegeId && college) {
        updateData.collegeId = college.id;
        if (!user.college) updateData.college = college.shortName;
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
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
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(500).json({ error: "Failed to synchronize profile." });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user details.
 */
async function getMe(req, res) {
  if (!req.supabaseUser) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  if (!req.user) {
    return res.json({
      incomplete: true,
      email: req.supabaseUser.email,
      name: req.supabaseUser.email.split("@")[0]
    });
  }

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    email_verified: req.user.emailVerified,
    college: req.user.college,
    college_id: req.user.email, // Legacy mapping
    department: req.user.department,
    reputation_score: req.user.reputationScore,
    bio: req.user.bio,
    instagram: req.user.instagram,
    github: req.user.github,
    interests: req.user.interests,
    campus_id: req.user.collegeId,
    campus_name: req.user.collegeRef?.shortName || "",
    verified_at: req.user.verifiedAt
  });
}

/**
 * POST /api/auth/logout
 * Clears session.
 */
async function logout(req, res) {
  res.json({ success: true, message: "Logged out." });
}

module.exports = {
  checkDomain,
  syncProfile,
  getMe,
  logout
};
