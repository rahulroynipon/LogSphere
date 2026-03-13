const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const logger = require('./logger');

// Dashboard logic

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
 * @param {string} [options.logDir] Custom path to the log directory
 */
function createDashboardRouter(options = {}) {
    const router = express.Router();
    
    // Flag all dashboard requests to skip logging in expressLogger
    router.use((req, res, next) => {
        req.skipLogging = true;
        next();
    });

    // Default to the project root logs folder, or use the configured path
    const LOG_DIR = options.logDir || path.join(process.cwd(), 'logs');

    // Authentication Helper
    const isAuthorized = (req) => {
        if (!options.username || !options.password) return true;

        // Check for Basic Auth Header
        const authHeader = req.headers.authorization || '';
        if (authHeader.startsWith('Basic ')) {
            const [user, pass] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
            if (user === options.username && pass === options.password) return true;
        }

        // Check for Custom Cookie Auth
        const cookies = req.headers.cookie || '';
        const authCookie = cookies.split('; ').find(row => row.startsWith('LogSphereAuth='));
        if (authCookie) {
            const token = authCookie.split('=')[1];
            const [user, pass] = Buffer.from(token, 'base64').toString().split(':');
            if (user === options.username && pass === options.password) return true;
        }

        return false;
    };

    // Middleware to protect API routes
    const protect = (req, res, next) => {
        if (isAuthorized(req)) return next();
        res.status(401).json({ error: 'Unauthorized' });
    };

    // Handle Login Post
    router.post('/', express.json(), (req, res) => {
        const { username, password } = req.body;
        if (username === options.username && password === options.password) {
            logger.info(`Dashboard: User "${username}" logged in successfully`, { category: 'dashboard-auth', username });
            const token = Buffer.from(`${username}:${password}`).toString('base64');
            // Set cookie for 7 days
            res.setHeader('Set-Cookie', `LogSphereAuth=${token}; Path=${req.baseUrl || '/'}; HttpOnly; Max-Age=${7 * 24 * 60 * 60}`);
            return res.json({ success: true });
        }
        logger.warn(`Dashboard: Failed login attempt for user "${username}"`, { category: 'dashboard-auth', username });
        res.status(401).json({ error: 'Invalid credentials' });
    });

    // 1. Serve the HTML Web UI
    router.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
    });


    // Handle Logout
    router.post('/logout', (req, res) => {
        const basePath = req.baseUrl || '/';
        res.setHeader('Set-Cookie', [
            `LogSphereAuth=; Path=${basePath}; HttpOnly; Max-Age=0`,
            `LogSphereAuth=; Path=${basePath}/; HttpOnly; Max-Age=0`,
            `LogSphereAuth=; Path=/; HttpOnly; Max-Age=0`
        ]);
        res.json({ success: true });
    });


    // 2. Build the JSON API to feed the dashboard UI

    router.get('/api', protect, async (req, res) => {

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

    // 3. Build the Clear Logs API
    router.delete('/api/clear', protect, (req, res) => {

        try {
            if (fs.existsSync(LOG_DIR)) {
                const allFiles = fs.readdirSync(LOG_DIR)
                                 .filter(f => f.startsWith('log-') && f.endsWith('.log'));
                for (const file of allFiles) {
                    fs.unlinkSync(path.join(LOG_DIR, file));
                }
                logger.warn(`Dashboard: All log files cleared by user`, { category: 'dashboard-admin' });
            }
            res.status(200).json({ success: true });
        } catch (e) {
            console.error("Failed to clear logs:", e);
            res.status(500).json({ error: "Failed to clear logs" });
        }
    });

    return router;
}

module.exports = createDashboardRouter;
