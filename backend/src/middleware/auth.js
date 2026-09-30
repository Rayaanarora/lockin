const supabase = require("../config/supabase");
const prisma = require("../config/db");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const isDemo =
      req.headers["x-demo-user-id"] === "101" ||
      authHeader === "Bearer demo-token-101" ||
      (typeof authHeader === "string" && authHeader.includes("demo-token"));

    if (isDemo) {
      let dbUser = null;
      try {
        dbUser = await prisma.user.findFirst({
          where: { id: 101 },
          include: { collegeRef: true }
        });
      } catch (e) {
        console.warn("[DEMO AUTH] DB fetch error:", e);
      }

      if (!dbUser) {
        dbUser = {
          id: 101,
          name: "Faheem",
          email: "faheem@srmist.edu.in",
          college: "SRM KTR",
          collegeId: 1634,
          department: "Networking and Communications",
          reputationScore: 180
        };
      }

      req.supabaseUser = { id: "101", email: "faheem@srmist.edu.in" };
      req.user = dbUser;
      req.userId = 101;
      if (req.query) req.query.userId = "101";
      if (req.body && typeof req.body === "object") req.body.userId = 101;
      return next();
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session token." });
    }

    // Attach Supabase auth user information to the request
    req.supabaseUser = user;

    // Find local database user matching the Supabase ID
    let dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { collegeRef: true }
    });

    // If not found by Supabase ID, try linking via email address
    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { collegeRef: true }
      });

      if (dbUser) {
        // Link the existing user row to this Supabase Auth account
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseId: user.id },
          include: { collegeRef: true }
        });
      }
    }

    req.user = dbUser;

    if (dbUser) {
      req.userId = dbUser.id;
      // Inject standard parameters so that existing controllers work without modifications
      req.query.userId = String(dbUser.id);
      req.body.userId = dbUser.id;
    }

    next();
  } catch (err) {
    console.error("[AUTH MIDDLEWARE ERROR]", err);
    res.status(500).json({ error: "Authentication middleware error." });
  }
}

module.exports = { requireAuth };
