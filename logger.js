// logger.js - Core logging module for LogSphere

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createWriteStream } = require('fs');
const { format } = require('date-fns');

// Load transports
let transports = [];

// Register a transport
function addTransport(transport) {
  transports.push(transport);
}

// Load default file transport
const fileTransport = require('./transports/fileTransport');
addTransport(fileTransport);

// Load default remote transport
const remoteTransport = require('./transports/remoteTransport');
addTransport(remoteTransport);

// Global error handlers (will be attached when logger is initialized)
function attachGlobalHandlers() {
  process.on('uncaughtException', (err) => {
    error('Uncaught Exception', err);
    // Optionally exit after logging
    // process.exit(1);
  });
  process.on('unhandledRejection', (reason, promise) => {
    error('Unhandled Rejection', reason);
  });
}

// Helper to build log entry
function buildEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    meta,
  };
  if (meta && meta.stack) {
    entry.stack = meta.stack;
  }
  return entry;
}

// Core logging function – sends entry to all transports asynchronously
function log(level, message, meta = {}) {
  const entry = buildEntry(level, message, meta);
  const json = JSON.stringify(entry) + '\n';
  transports.forEach((t) => {
    try {
      t.write(json);
    } catch (e) {
      // Fallback: write to console if transport fails
      console.error('Logging transport error:', e);
    }
  });
}

function debug(msg, meta) { log('DEBUG', msg, meta); }
function info(msg, meta) { log('INFO', msg, meta); }
function warn(msg, meta) { log('WARN', msg, meta); }
function error(msg, err, meta = {}) {
  const stack = err && err.stack ? err.stack : undefined;
  const enriched = { ...meta, stack, errorMessage: err && err.message ? err.message : undefined };
  log('ERROR', msg, enriched);
}

// Initialize logger (add default transports and attach handlers)
function initLogger() {
  // Ensure default transports are added (already added above)
  attachGlobalHandlers();
}

// Exported Logger API
module.exports = {
  addTransport,
  attachGlobalHandlers,
  initLogger,
  debug,
  info,
  warn,
  error,
};
