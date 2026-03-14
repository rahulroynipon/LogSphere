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
    ...logger.config, // Inherit global settings
    ...options       // Override with local options
  };

  return function expressLogger(req, res, next) {
    // Generate Request ID and attach to request/response
    const reqId = uuidv4();
    req.id = reqId;
    res.locals.reqId = reqId;
    res.setHeader('X-Request-Id', reqId);

    // Skip logging if path matches or if skipLogging flag is set
    const fullPath = req.originalUrl.split('?')[0]; 
    
    // Ensure excludePaths is always an array to prevent crashes
    const excludeList = Array.isArray(config.excludePaths) ? config.excludePaths : [];
    
    const isExcluded = excludeList.some(p => {
      if (!p || typeof p !== 'string') return false;
      
      // Exact match
      if (fullPath === p) return true;
      
      // Base path match (e.g., /dashboard excludes /dashboard/api)
      const base = p.endsWith('/') ? p : p + '/';
      // Safety: Don't allow "/" to accidentally exclude everything via startsWith
      if (base === '/') return fullPath === '/';
      
      return fullPath.startsWith(base);
    });

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

    // Support both singular and plural forms for logging configuration
    const shouldLogHeaders = config.logHeaders || config.logHeader;
    const shouldLogBody = config.logBody || config.logBodys;
    const shouldLogQuery = config.logQuery || config.logQueries;
    const shouldLogResponse = config.logResponse || config.logResponses;

    if (shouldLogHeaders) {
      reqInfo.headers = req.headers;
    }
    if (shouldLogBody && req.body) {
      reqInfo.body = req.body;
    }
    if (shouldLogQuery && Object.keys(req.query || {}).length > 0) {
      reqInfo.query = req.query;
    }

    // Capture response body if requested
    let resBody;
    if (shouldLogResponse) {
      const originalSend = res.send;
      res.send = function(body) {
        resBody = body;
        return originalSend.apply(res, arguments);
      };
      
      const originalJson = res.json;
      res.json = function(body) {
        resBody = body;
        return originalJson.apply(res, arguments);
      };
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

      if (shouldLogResponse && resBody) {
        // Try to parse if it's a string, or just use it if it's already an object
        try {
          resInfo.responseBody = typeof resBody === 'string' ? JSON.parse(resBody) : resBody;
        } catch (e) {
          resInfo.responseBody = resBody;
        }
      }

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
