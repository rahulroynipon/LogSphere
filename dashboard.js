const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const LOG_DIR = path.resolve(__dirname, 'logs');

/**
 * Parses a single JSON log line safely
 */
function parseJsonSafe(line) {
    try {
        return JSON.parse(line);
    } catch (e) {
        return null;
    }
}

/**
 * Reads a single log file line by line and parses the JSON
 */
function readLogFile(filePath) {
    return new Promise((resolve) => {
        const results = [];
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', () => {
             resolve([]); // ignore read errors
        });

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            const parsed = parseJsonSafe(line);
            if (parsed) results.push(parsed);
        });

        rl.on('close', () => {
            resolve(results);
        });
    });
}

/**
 * Dashboard Router module
 * 
 * Exposes a Web UI dashboard for developers to view structured logs in real-time.
 *
 * @param {Object} options Configuration options for dashboard
 * @param {string} [options.username] Username for Basic Auth
 * @param {string} [options.password] Password for Basic Auth
 */
function createDashboardRouter(options = {}) {
    const router = express.Router();

    // Basic Authentication Middleware
    if (options.username && options.password) {
        router.use((req, res, next) => {
            const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
            const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

            if (login && password && login === options.username && password === options.password) {
                return next();
            }

            res.set('WWW-Authenticate', 'Basic realm="LogSphere Secure Dashboard"');
            res.status(401).send('Authentication required to view logs.');
        });
    }

    // 1. Serve the HTML Web UI (dashboard/index.html)
    router.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
    });

    // 2. Build the JSON API to feed the dashboard UI
    router.get('/api', async (req, res) => {
        try {
            // Check if log directory exists
            if (!fs.existsSync(LOG_DIR)) {
                return res.json([]);
            }

            // Get all files matching `log-*.log`
            const allFiles = fs.readdirSync(LOG_DIR)
                             .filter(f => f.startsWith('log-') && f.endsWith('.log'));

            // Sort by newest first (alphabetically based on YYYY-MM-DD pattern)
            allFiles.sort((a,b) => b.localeCompare(a));

            // Load all log objects 
            // Warning: For extreme enterprise systems, this should implement pagination instead of reading all files at once.
            let mergedLogs = [];
            for (const file of allFiles) {
                const logs = await readLogFile(path.join(LOG_DIR, file));
                mergedLogs = mergedLogs.concat(logs);
                // Hard-cap the viewable logs to prevent memory exhaustion on massive files
                if (mergedLogs.length >= 1000) break;
            }

            // Send limited results back to the browser
            res.json(mergedLogs.slice(0, 1000));

        } catch (e) {
            console.error("Dashboard API Error:", e);
            res.status(500).json({ error: "Failed to read logs" });
        }
    });

    return router;
}

module.exports = createDashboardRouter;
