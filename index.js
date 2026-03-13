const logger = require('./logger');
const expressLogger = require('./expressLogger');
const dashboard = require('./dashboard');

/**
 * LogSphere - Professional Node.js Logging System
 * 
 * @author Rahul Roy Nipon <rahulroynipon@gmail.com>
 * @license MIT
 */

// Export individual functions for ESM compatibility
exports.configure = logger.configure;
exports.expressLogger = expressLogger;
exports.dashboard = dashboard;

// Direct logging methods for easy access, e.g., LogSphere.info("Hello")
exports.debug = logger.debug;
exports.info = logger.info;
exports.warn = logger.warn;
exports.error = logger.error;

// Access to the raw logger instance if needed
exports.logger = logger;

