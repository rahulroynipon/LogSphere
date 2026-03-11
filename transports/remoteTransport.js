// remoteTransport.js - Sends log entries to a remote logging server via HTTP POST

const https = require('https');
const url = require('url');

// Configuration – in a real project this could be loaded from env variables
const REMOTE_LOG_ENDPOINT = process.env.REMOTE_LOG_ENDPOINT || 'https://example-log-server.com/api/logs';

function write(logEntry) {
  const parsedUrl = url.parse(REMOTE_LOG_ENDPOINT);
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(logEntry),
    },
  };

  const req = https.request(options, (res) => {
    // Consume response data to free memory
    res.on('data', () => {});
    // Optionally handle non‑2xx responses
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error(`Remote log failed with status ${res.statusCode}`);
    }
  });

  req.on('error', (e) => {
    console.error('Error sending remote log:', e);
  });

  req.write(logEntry);
  req.end();
}

module.exports = {
  write,
};
