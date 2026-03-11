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
 */
function createDashboardRouter() {
    const router = express.Router();

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
