// logger.js - Core logging module for LogSphere

/**
 * LogSphere - Core Logger
 * @author Rahul Roy Nipon <rahulroynipon@gmail.com>
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createWriteStream } = require('fs');
const { format } = require('date-fns');
const https = require('https');

// Load transports
let transports = [];

// Register a transport
function addTransport(transport) {
  transports.push(transport);
}

// Load default transports
const fileTransport = require('./transports/fileTransport');
const remoteTransport = require('./transports/remoteTransport');
const consoleTransport = require('./transports/consoleTransport');

// Default Configuration
let config = {
  sensitiveKeys: ['password', 'token', 'secret', 'authorization', 'cookie', 'session'],
  enableConsoleLogs: true,
  enableFileLogs: true,
  enableRemoteLogs: false,
  maxLogFiles: false,   // Default: false (keep unlimited files)
  maxExpireDays: false, // Default: false (never expire by days)
  discordWebhookUrl: null, // Default: no webhook
  logDir: path.join(process.cwd(), 'logs'), // Set default log location relative to project root
  minLevel: 'DEBUG',    // Default: capture everything
};

const LEVEL_PRIORITIES = {
  'DEBUG': 0,
  'INFO': 1,
  'WARN': 2,
  'ERROR': 3
};

// Apply transport configuration
function applyTransports() {
  transports = []; // clear existing
  if (config.enableConsoleLogs) addTransport(consoleTransport);
  if (config.enableFileLogs) {
    if (typeof fileTransport.init === 'function') {
      fileTransport.init(config);
    }
    addTransport(fileTransport);
  }
  if (config.enableRemoteLogs) addTransport(remoteTransport);
}

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

function redact(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }
  const redactedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (config.sensitiveKeys.includes(key.toLowerCase())) {
      redactedObj[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redactedObj[key] = redact(value);
    } else {
      redactedObj[key] = value;
    }
  }
  return redactedObj;
}

// Helper to build log entry
function buildEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  
  // Create a base entry
  const entry = {
    timestamp,
    level,
    message,
    meta: redact(meta), // Redact sensitive info in meta
  };
  if (meta && meta.stack) {
    entry.stack = meta.stack;
  }
  return entry;
}

// Core logging function – sends entry to all transports asynchronously
function log(level, message, meta = {}) {
  // Check if log level meets the minimum threshold
  const currentPriority = LEVEL_PRIORITIES[level] || 0;
  const minPriority = LEVEL_PRIORITIES[config.minLevel.toUpperCase()] || 0;

  if (currentPriority < minPriority) {
    return; // Skip logging if below threshold
  }

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

  // Trigger webhooks for ERROR level
  if (level === 'ERROR' && config.discordWebhookUrl) {
    sendDiscordAlert(entry);
  }
}

function sendDiscordAlert(entry) {
  try {
    const urlObj = new URL(config.discordWebhookUrl);
    
    // Build a nicely formatted Discord embed payload
    let description = `**Message:** ${entry.message}\n`;
    if (entry.meta && Object.keys(entry.meta).length > 0) {
       description += `**Metadata:**\n\`\`\`json\n${JSON.stringify(entry.meta, null, 2).substring(0, 1000)}\n\`\`\`\n`;
    }
    if (entry.stack) {
       description += `**Stack Trace:**\n\`\`\`\n${entry.stack.substring(0, 500)}\n\`\`\``;
    }

    const payload = JSON.stringify({
      embeds: [{
        title: "🚨 LogSphere Critical Error",
        color: 0xbf616a, // Red color
        description: description,
        timestamp: entry.timestamp
      }]
    });

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => { res.on('data', () => {}); });
    req.on('error', (e) => console.error("Discord Webhook Failed:", e.message));
    req.write(payload);
    req.end();
  } catch (err) {
    console.error("Invalid Discord URL or Webhook Error:", err.message);
  }
}

function debug(msg, meta) { log('DEBUG', msg, meta); }
function info(msg, meta) { log('INFO', msg, meta); }
function warn(msg, meta) { log('WARN', msg, meta); }
function error(msg, err, meta = {}) {
  const stack = err && err.stack ? err.stack : undefined;
  const enriched = { ...meta, stack, errorMessage: err && err.message ? err.message : undefined };
  log('ERROR', msg, enriched);
}

// Configure logger dynamically
function configure(options = {}) {
  Object.assign(config, options);
  
  // Format sensitive keys to lowercase for case-insensitive matching
  if (config.sensitiveKeys) {
    config.sensitiveKeys = config.sensitiveKeys.map(k => k.toLowerCase());
  }

  applyTransports();
  attachGlobalHandlers();
}

// Auto-initialize with defaults on require
applyTransports();

// Exported Logger API
module.exports = {
  addTransport,
  attachGlobalHandlers,
  configure,
  debug,
  info,
  warn,
  error,
  config, // Export the config object
};
