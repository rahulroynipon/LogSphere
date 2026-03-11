// expressLogger.js - Configurable Express middleware for logging requests

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

/**
 * Creates an Express middleware for logging requests with configurable options.
 * 
 * @param {Object} options Configuration options for the logger middleware.
 * @param {boolean} [options.logHeaders=false] Whether to log request headers.
 * @param {boolean} [options.logBody=false] Whether to log the request body.
 * @param {boolean} [options.logQuery=true] Whether to log query parameters.
 * @param {Array<string>} [options.excludePaths=[]] Paths that should not be logged.
 * @returns {Function} Express middleware function.
 */
function createExpressLogger(options = {}) {
  // Pass the options to the core logger to configure everything at once
  logger.configure(options);

  const config = {
    logHeaders: false,
    logBody: false,
    logQuery: true,
    excludePaths: [],
    ...options
  };

  return function expressLogger(req, res, next) {
    // Generate Request ID and attach to request/response
    const reqId = uuidv4();
    req.id = reqId;
    res.locals.reqId = reqId;

    if (config.excludePaths.includes(req.path)) {
      return next();
    }

    const start = Date.now();
    const reqInfo = {
      reqId,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress
    };

    if (config.logHeaders) {
      reqInfo.headers = req.headers;
    }
    if (config.logBody && req.body) {
      reqInfo.body = req.body;
    }
    if (config.logQuery && Object.keys(req.query || {}).length > 0) {
      reqInfo.query = req.query;
    }

    // Log the incoming request
    logger.info(`Incoming Request: ${req.method} ${req.url}`, reqInfo);

    // Hook into response finish to log the result
    res.on('finish', () => {
      const duration = Date.now() - start;
      const resInfo = {
        reqId,
        statusCode: res.statusCode,
        durationMs: duration
      };

      if (res.statusCode >= 500) {
        logger.error(`Request Failed: ${req.method} ${req.url}`, new Error(`HTTP ${res.statusCode}`), resInfo);
      } else if (res.statusCode >= 400) {
        logger.warn(`Request Warning: ${req.method} ${req.url}`, resInfo);
      } else {
        logger.info(`Request Completed: ${req.method} ${req.url}`, resInfo);
      }
    });

    next();
  };
}

module.exports = createExpressLogger;
