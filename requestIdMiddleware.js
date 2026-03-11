// requestIdMiddleware.js - Express middleware to assign a unique request ID

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware that generates a UUID for each incoming request and attaches it to the request object.
 * Also makes the request ID available in response locals for downstream use (e.g., logging).
 */
function requestIdMiddleware(req, res, next) {
  const requestId = uuidv4();
  req.id = requestId;
  // Make it available for templates or other middleware
  res.locals.requestId = requestId;
  next();
}

module.exports = requestIdMiddleware;
