const DB_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ER_BAD_DB_ERROR",
  "ER_ACCESS_DENIED_ERROR",
  "PROTOCOL_CONNECTION_LOST"
]);

function isDbUnavailable(error) {
  return DB_UNAVAILABLE_CODES.has(error?.code);
}

module.exports = { isDbUnavailable };

