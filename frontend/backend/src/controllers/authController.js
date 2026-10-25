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

const otpStore = new Map(); // fallback memory store: email -> { code, expiresAt, createdAt, attempts }
const verifiedEmailStore = new Map();

/**
 * POST /api/auth/send-otp
 * Body: { email: string }
 * Generates and sends a 6-digit numeric OTP via Resend.
 */
async function sendOtp(req, res) {
  const { email } = req.body || {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid student email is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: 1 request per 30 seconds
  const memEntry = otpStore.get(normalizedEmail);
  if (memEntry && Date.now() < memEntry.createdAt + 30000) {
    const waitSec = Math.ceil((memEntry.createdAt + 30000 - Date.now()) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSec}s before requesting another code.` });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Store in DB (prisma.otp) with fallback
  try {
    await prisma.otp.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true }
    });

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code: code,
        expiresAt: expiresAt,
        used: false
      }
    });
  } catch (err) {
    console.warn("Could not persist OTP in DB, using in-memory store:", err?.message || err);
  }

  // Also store in memory cache
  otpStore.set(normalizedEmail, {
    code,
    expiresAt: expiresAt.getTime(),
    createdAt: Date.now(),
    attempts: 0
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromAddr = process.env.RESEND_FROM || "LOCKIN <onboarding@resend.dev>";
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [normalizedEmail],
          subject: `${code} is your LOCKIN verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 24px; border-radius: 12px; max-width: 460px; margin: 0 auto; border: 1px solid #222;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #D2042D; margin-bottom: 8px;">LOCKIN AUTH</div>
              <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0;">Verify your college email</h1>
              <p style="font-size: 14px; line-height: 1.5; color: #888888; margin: 0 0 24px 0;">Enter this 6-digit code to complete your signup and verify your student status:</p>
              <div style="background-color: #111111; border: 1px solid #333333; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #D2042D; display: inline-block;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #555555; margin: 0;">This verification code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
            </div>
          `
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error("Resend OTP send error:", data);
      }
    } catch (err) {
      console.error("Resend OTP send error:", err);
    }
  } else {
    console.log(`[AUTH OTP DEV] 6-digit code for ${normalizedEmail}: ${code}`);
  }

  res.json({
    success: true,
    message: "Verification code sent to your email.",
    ...(process.env.NODE_ENV !== "production" || !resendApiKey ? { devCode: code } : {})
  });
}

/**
 * POST /api/auth/verify-otp
 * Body: { email: string, code: string }
 */
async function verifyOtp(req, res) {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const inputCode = String(code).trim();
  let verified = false;

  // 1. Try DB lookup first
  try {
    const record = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (record) {
      if (record.code.trim() === inputCode) {
        await prisma.otp.update({
          where: { id: record.id },
          data: { used: true }
        });
        otpStore.delete(normalizedEmail);
        verified = true;
      }
    }
  } catch (err) {
    console.warn("DB OTP verify check failed, checking in-memory store:", err?.message || err);
  }

  // 2. Fallback to memory store if DB did not verify
  if (!verified) {
    const memEntry = otpStore.get(normalizedEmail);
    if (memEntry) {
      if (Date.now() > memEntry.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }
      if (memEntry.attempts >= 5) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: "Too many invalid attempts. Please request a new code." });
      }
      if (memEntry.code.trim() === inputCode) {
        otpStore.delete(normalizedEmail);
        verified = true;
      } else {
        memEntry.attempts += 1;
        return res.status(400).json({ error: "Invalid 6-digit code. Please try again." });
      }
    }
  }

  if (!verified) {
    return res.status(400).json({ error: "Invalid or expired verification code. Please request a new one." });
  }

  verifiedEmailStore.set(normalizedEmail, Date.now());

  res.json({
    success: true,
    verified: true,
    message: "Email verified successfully."
  });
}

module.exports = {
  checkDomain,
  syncProfile,
  getMe,
  logout,
  sendOtp,
  verifyOtp
};
