const prisma = require("../config/db");

/*
 * Interactive transaction with room for a cold serverless start.
 * Prisma's defaults (2s to get a connection, 5s total) are tight enough that a
 * slow first connection fails the request with a generic 500.
 */
const TX_OPTIONS = { maxWait: 10000, timeout: 20000 };

function runTx(fn) {
  return prisma.$transaction(fn, TX_OPTIONS);
}

module.exports = { runTx };
