/**
 * Centralized error-handling middleware (PROJECT_SPEC.md §8.2, AI-RULES.md §4.2).
 *
 * Must be registered LAST in app.js, after all routes, and must have
 * exactly 4 parameters — that's how Express recognizes it as an
 * error handler rather than normal middleware.
 *
 * Any route/controller that calls next(err) — or throws inside an
 * async handler wrapped to forward errors — ends up here instead of
 * Express's default HTML error page.
 */
function errorHandler(err, req, res, next) {
  console.error(err); // server-side visibility; never sent to the client

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong.' : err.message;

  const body = { error: message };

  if (err.details) {
    body.details = err.details;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;