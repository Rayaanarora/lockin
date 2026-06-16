require("dotenv").config();
const prisma = require("./src/config/db");
const { isDbUnavailable } = require("./src/utils/dbFallback");

async function main() {
  try {
    console.log("Simulating findMany query...");
    await prisma.sessionRecap.findMany({
      where: { userId: 112 },
      include: { mission: { select: { location: true } } }
    });
    console.log("Query completed successfully!");
  } catch (err) {
    console.log("ERROR DETECTED:");
    console.log("Constructor Name:", err.constructor.name);
    console.log("Error Code:", err.code);
    console.log("Error Message:", err.message);
    console.log("Error Stack:", err.stack);
    console.log("Is DB Unavailable according to dbFallback?", isDbUnavailable(err));
  } finally {
    await prisma.$disconnect();
  }
}

main();
