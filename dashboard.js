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
    
    // 0. Middleware to relax Content-Security-Policy for the dashboard.
    // Helmet often blocks inline scripts which are essential for this stand-alone dashboard.
    router.use((req, res, next) => {
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
        );
        req.skipLogging = true;
        next();
    });

    // Helper to get the current log directory (dynamic if global config changes)
    const getLogDir = () => {
        const dir = options.logDir || (logger.config && logger.config.logDir) || path.join(process.cwd(), 'logs');
        return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
    };

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
        const authCookie = cookies.split('; ').find(row => row.trim().startsWith('LogSphereAuth='));
        if (authCookie) {
            const token = authCookie.split('=')[1];
            try {
                const decoded = Buffer.from(token, 'base64').toString().split(':');
                if (decoded.length === 2) {
                    const [user, pass] = decoded;
                    if (user === options.username && pass === options.password) return true;
                }
            } catch (e) {
                return false;
            }
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
            const token = Buffer.from(`${username}:${password}`).toString('base64');
            // Set cookie for 7 days. Use Path=/ to ensure it works across all sub-paths reliably
            res.setHeader('Set-Cookie', `LogSphereAuth=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
            return res.json({ success: true });
        }
        res.status(401).json({ error: 'Invalid credentials' });
    });

    // 1. Serve the HTML Web UI
    router.get('/', (req, res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
        // Prevent browser caching of log data
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        try {
            const logDir = getLogDir();
            // Check if log directory exists
            if (!fs.existsSync(logDir)) {
                return res.json([]);
            }

            // Get all files matching `log-*.log`
            const allFiles = fs.readdirSync(logDir)
                             .filter(f => f.startsWith('log-') && f.endsWith('.log'));

            // Sort by newest first (alphabetically based on YYYY-MM-DD pattern)
            allFiles.sort((a,b) => b.localeCompare(a));

            // Load all log objects 
            let mergedLogs = [];
            for (const file of allFiles) {
                const logs = await readLogFile(path.join(logDir, file));
                // Add logs in reverse order (newest first within the file)
                mergedLogs = mergedLogs.concat(logs.reverse());
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
            const logDir = getLogDir();
            if (fs.existsSync(logDir)) {
                const allFiles = fs.readdirSync(logDir)
                                 .filter(f => f.startsWith('log-') && f.endsWith('.log'));
                for (const file of allFiles) {
                    try {
                        fs.unlinkSync(path.join(logDir, file));
                    } catch (unlinkErr) {
                        console.error(`Failed to unlink ${file}:`, unlinkErr);
                    }
                }
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
