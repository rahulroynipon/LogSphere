/**
 * LogSphere - A ready-to-use, beautiful, and configurable logging system.
 * 
 * Simply require this module and use it instantly, or configure it explicitly.
 */

const logger = require('./logger');
const expressLogger = require('./expressLogger');
const dashboard = require('./dashboard');

// Export the core LogSphere interface
module.exports = {
  // Configures the global logging parameters
  configure: logger.configure,
  
  // The Express configuration middleware
  expressLogger: expressLogger,

  // Developer Web UI Dashboard Router
  dashboard: dashboard,

  // Direct logging methods for easy access, e.g., LogSphere.info("Hello")
  debug: logger.debug,
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  
  // Access to the raw logger instance if needed
  logger: logger
};
