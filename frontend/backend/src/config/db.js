const { PrismaClient } = require("@prisma/client");

/*
 * One PrismaClient per server instance, reused across requests.
 *
 * Supabase's transaction pooler (port 6543) cannot use prepared statements, so
 * Prisma must be told it is talking to PgBouncer; without that, queries fail
 * intermittently with "prepared statement already exists". Fill in safe
 * defaults when the configured URL leaves them out.
 */
function databaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const pooled = url.port === "6543" || url.hostname.includes("pooler.supabase.com");
    if (pooled && url.port === "6543" && !url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (pooled && !url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
    return url.toString();
  } catch {
    return raw;
  }
}

const prisma =
  global.__lockinPrisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: ["error"]
  });

global.__lockinPrisma = prisma;

module.exports = prisma;
