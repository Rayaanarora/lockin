const crypto = require("crypto");
const prisma = require("../config/db");
const { isDbUnavailable } = require("../utils/dbFallback");

// ─── OTP Helpers ─────────────────────────────────────────────────────
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// Simple hash for OTP storage (not bcrypt to avoid dependency for now)
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * POST /api/auth/send-otp
 * Body: { email: string }
 * Sends a 6-digit OTP to the email. Also detects college from domain.
 */
async function sendOtp(req, res) {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  try {
    // Detect college from email domain
    let college = await prisma.college.findFirst({
      where: { emailDomain: domain }
    });

    // Try stripping subdomains
    if (!college) {
      const parts = domain.split(".");
      if (parts.length > 2) {
        const baseDomain = parts.slice(1).join(".");
        college = await prisma.college.findFirst({
          where: { emailDomain: baseDomain }
        });
      }
    }

    // Invalidate any existing unused OTPs for this email
    await prisma.otp.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true }
    });

    // Generate and store OTP
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code: hashedOtp,
        expiresAt
      }
    });

    // For now, log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[OTP] OTP for ${normalizedEmail}: ${otp}\n`);
    }
 
    // If Resend API key is configured, send the actual email
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "LOCKIN <onboarding@resend.dev>",
          to: normalizedEmail,
          subject: `${otp} is your LOCKIN verification code`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e1e1e6; border-radius: 12px;">
              <h2 style="color: #810100; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; font-family: monospace; letter-spacing: 2px;">LOCKIN</h2>
              <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin-bottom: 24px;">Here is your student verification code. Use it to log in and start executing:</p>
              <div style="background-color: #f4f4f5; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #18181b; margin: 24px 0; font-family: monospace;">
                ${otp}
              </div>
              <p style="font-size: 11px; color: #a1a1aa; line-height: 1.4; margin-top: 24px;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
            </div>
          `
        });
        console.log(`[EMAIL] Real OTP email sent to ${normalizedEmail} via Resend.`);
      } catch (emailErr) {
        console.error("[ERROR] Failed to send email via Resend:", emailErr);
      }
    }

    res.json({
      success: true,
      message: "OTP sent to your email.",
      college: college
        ? {
            id: college.id,
            name: college.shortName,
            full_name: college.collegeName,
            college_type: college.collegeType
          }
        : null,
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV !== "production" && { dev_otp: otp })
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(500).json({ error: "Failed to send OTP." });
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { email: string, code: string }
 * Verifies OTP, creates or returns user, issues session info.
 */
async function verifyOtp(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and OTP code are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedCode = hashOtp(code.trim());

  try {
    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        code: hashedCode,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Detect college
    const domain = normalizedEmail.split("@")[1];
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

    const isNewUser = !user;

    if (isNewUser) {
      // Create minimal user — frontend will complete profile during onboarding
      user = await prisma.user.create({
        data: {
          name: normalizedEmail.split("@")[0],
          email: normalizedEmail,
          emailVerified: true,
          verifiedAt: new Date(),
          college: college ? college.shortName : null,
          collegeId: college ? college.id : null,
          reputationScore: 100
        }
      });
    } else {
      // Update verification status
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verifiedAt: new Date(),
          college: college ? college.shortName : user.college,
          collegeId: college ? college.id : user.collegeId
        }
      });
    }

    // TODO: Generate JWT token when jsonwebtoken is installed
    // const jwt = require("jsonwebtoken");
    // const token = jwt.sign(
    //   { userId: user.id, email: user.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "7d" }
    // );

    res.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.emailVerified,
        college: user.college,
        college_id: user.email,
        department: user.department,
        reputation_score: user.reputationScore,
        bio: user.bio,
        instagram: user.instagram,
        github: user.github,
        interests: user.interests,
        campus_id: user.collegeId,
        verified_at: user.verifiedAt
      }
      // token  // Uncomment when JWT is implemented
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(500).json({ error: "Verification failed." });
  }
}

/**
 * GET /api/auth/me
 * Returns the current user (based on userId query param for now, JWT later)
 */
async function getMe(req, res) {
  // TODO: Extract userId from JWT token instead of query param
  const userId = Number(req.query.userId);

  if (isNaN(userId)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { collegeRef: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      email_verified: user.emailVerified,
      college: user.college,
      college_id: user.email,
      department: user.department,
      reputation_score: user.reputationScore,
      bio: user.bio,
      instagram: user.instagram,
      github: user.github,
      interests: user.interests,
      campus_id: user.collegeId,
      campus_name: user.collegeRef?.shortName || "",
      verified_at: user.verifiedAt
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    res.status(500).json({ error: "Failed to fetch user." });
  }
}

/**
 * POST /api/auth/logout
 * Clears session (placeholder — will clear JWT cookie when implemented)
 */
async function logout(req, res) {
  // TODO: Clear httpOnly cookie with JWT
  res.json({ success: true, message: "Logged out." });
}

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  logout
};
