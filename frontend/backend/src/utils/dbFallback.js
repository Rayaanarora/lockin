/**
 * Offline fallbacks are disabled.
 *
 * Controllers used to answer with invented users, posts and recaps when the
 * database was unreachable (memoryStore). That is fake data in a product
 * whose core rule is "no fake data", and it hid outages. Every
 * `if (isDbUnavailable(error))` branch is now skipped, the error propagates,
 * and the route returns an honest 503 via sendServerError().
 */
function isDbUnavailable() {
  return false;
}

module.exports = { isDbUnavailable };
