// test_cleanup.js
const fs = require('fs');
const path = require('path');
const LogSphere = require('./index');

const LOG_DIR = path.resolve(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Clear any existing test logs
const files = fs.readdirSync(LOG_DIR);
files.forEach(f => {
  if (f.startsWith('log-')) fs.unlinkSync(path.join(LOG_DIR, f));
});

console.log('--- Setup ---');
// 1. Create dummy log files with specific modification times
const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

// File 1: 10 days old
const fileOld = path.join(LOG_DIR, 'log-10-days.log');
fs.writeFileSync(fileOld, 'old log data');
fs.utimesSync(fileOld, new Date(now - 10 * oneDayMs), new Date(now - 10 * oneDayMs));

// File 2: 5 days old
const fileMid = path.join(LOG_DIR, 'log-5-days.log');
fs.writeFileSync(fileMid, 'mid log data');
fs.utimesSync(fileMid, new Date(now - 5 * oneDayMs), new Date(now - 5 * oneDayMs));

// File 3: 1 day old
const fileNew = path.join(LOG_DIR, 'log-1-day.log');
fs.writeFileSync(fileNew, 'new log data');
fs.utimesSync(fileNew, new Date(now - 1 * oneDayMs), new Date(now - 1 * oneDayMs));

console.log('Before cleanup:', fs.readdirSync(LOG_DIR));

// 2. Configure Logger to keep MAX 2 files OR anything newer than 7 days
// Wait, if maxLogFiles=2, we keep 2 newest (1-day and 5-days). The 10-day is deleted.
// If maxExpireDays=3, it would delete 5-days too. Let's test both!
LogSphere.configure({
  maxLogFiles: 2,       // Keep max 2 files
  maxExpireDays: 3,     // And delete anything older than 3 days
  enableConsoleLogs: false,
  enableFileLogs: true,
  enableRemoteLogs: false
});

// 3. Trigger a log to open the stream and run cleanup
process.stdout.write('Triggering cleanup...\n');
LogSphere.info('Triggering cleanup...');

// 4. Check results after a brief pause for async unlinking
setTimeout(() => {
  const finalFiles = fs.readdirSync(LOG_DIR);
  console.log('After cleanup:', finalFiles);
  
  // Clean up dummy files used for testing
  try {
     if(fs.existsSync(fileOld)) fs.unlinkSync(fileOld);
     if(fs.existsSync(fileMid)) fs.unlinkSync(fileMid);
     if(fs.existsSync(fileNew)) fs.unlinkSync(fileNew);
     const currentDay = require('date-fns').format(new Date(), 'yyyy-MM-dd');
     const todayFile = path.join(LOG_DIR, `log-${currentDay}.log`);
     if(fs.existsSync(todayFile)) fs.unlinkSync(todayFile);
  } catch(e){}

}, 500);
