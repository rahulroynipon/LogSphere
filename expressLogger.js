// expressLogger.js - Configurable Express middleware for logging requests

const { v4: uuidv4 } = require('uuid');
/**
 * LogSphere - Express Middleware
 * @author Rahul Roy Nipon <rahulroynipon@gmail.com>
 */
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
    slowRequestThresholdMs: 2000,
    ...options
  };

  return function expressLogger(req, res, next) {
    // Generate Request ID and attach to request/response
    const reqId = uuidv4();
    req.id = reqId;
    res.locals.reqId = reqId;
    res.setHeader('X-Request-Id', reqId);

    // Skip logging if path matches or if skipLogging flag is set
    // We use originalUrl to ensure we check the full path before any router-level modification
    const fullPath = req.originalUrl.split('?')[0]; 
    const isExcluded = config.excludePaths.some(p => 
      fullPath === p || fullPath.startsWith(p.endsWith('/') ? p : p + '/')
    );

    if (isExcluded || req.skipLogging) {
      return next();
    }

    const start = Date.now();
    const reqInfo = {
      reqId,
      method: req.method,
      url: req.originalUrl,
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
      // Check again if we should skip logging (might have been set by downstream middleware)
      if (req.skipLogging) return;

      const duration = Date.now() - start;
      const resInfo = {
        reqId,
        statusCode: res.statusCode,
        durationMs: duration
      };

      if (res.statusCode >= 500) {
        logger.error(`Request Failed: ${req.method} ${req.originalUrl}`, new Error(`HTTP ${res.statusCode}`), resInfo);
      } else if (res.statusCode >= 400) {
        logger.warn(`Request Warning: ${req.method} ${req.originalUrl}`, resInfo);
      } else if (duration > config.slowRequestThresholdMs) {
        // Flag slow queries specifically
        logger.warn(`Slow Request Detected: ${req.method} ${req.originalUrl} took ${duration}ms`, resInfo);
      } else {
        logger.info(`Request Completed: ${req.method} ${req.originalUrl}`, resInfo);
      }
    });

    next();
  };
}

module.exports = createExpressLogger;
