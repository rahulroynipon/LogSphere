// fileTransport.js - Asynchronous file transport with daily rotation and gzip compression

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { format } = require('date-fns');

// Configuration (could be made configurable later)
const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

let currentStream = null;
let currentLogPath = '';
let currentSize = 0;

function getLogFileName() {
  const datePart = format(new Date(), 'yyyy-MM-dd');
  return `log-${datePart}.log`;
}

function openNewLogStream() {
  const fileName = getLogFileName();
  currentLogPath = path.join(LOG_DIR, fileName);
  currentStream = fs.createWriteStream(currentLogPath, { flags: 'a' });
  currentSize = fs.existsSync(currentLogPath) ? fs.statSync(currentLogPath).size : 0;
}

function rotateIfNeeded() {
  if (!currentStream) {
    openNewLogStream();
    return;
  }
  // Rotate daily based on filename change
  const expectedName = getLogFileName();
  if (!currentLogPath.endsWith(expectedName)) {
    closeCurrentStream();
    openNewLogStream();
    return;
  }
  // Rotate by size
  if (currentSize >= MAX_FILE_SIZE) {
    closeCurrentStream();
    // Rename old file with timestamp
    const timestamp = format(new Date(), 'HHmmss');
    const rotatedName = `${currentLogPath}.${timestamp}`;
    fs.renameSync(currentLogPath, rotatedName);
    // Gzip the rotated file
    const gzip = zlib.createGzip();
    const source = fs.createReadStream(rotatedName);
    const destination = fs.createWriteStream(`${rotatedName}.gz`);
    source.pipe(gzip).pipe(destination);
    // Delete the uncompressed rotated file after compression finishes
    destination.on('finish', () => {
      fs.unlinkSync(rotatedName);
    });
    openNewLogStream();
  }
}

function closeCurrentStream() {
  if (currentStream) {
    currentStream.end();
    currentStream = null;
  }
}

function write(logEntry) {
  rotateIfNeeded();
  if (!currentStream) {
    openNewLogStream();
  }
  currentStream.write(logEntry);
  currentSize += Buffer.byteLength(logEntry);
}

module.exports = {
  write,
  close: closeCurrentStream,
};
