// test_dashboard.js
const express = require('express');
const LogSphere = require('./index');

const app = express();

app.use(express.json());

// Set up the logger
app.use(LogSphere.expressLogger({
    logBody: true,
    logHeaders: true
}));

// Setup the wonderful UI!
app.use('/logs', LogSphere.dashboard());

app.get('/trigger-error', (req, res) => {
    try {
        throw new Error("This is a simulated crash!");
    } catch(e) {
        LogSphere.error("System Failure Detected", e, { customId: 'A-123' });
        res.status(500).send("Crash logged, go check the dashboard.");
    }
});

const server = app.listen(3003, () => {
    console.log("Server listening! Go to: http://localhost:3003/logs");
    LogSphere.info("Server started, dashboard is mounted.");
    
    // Automatically fetch the dashboard to verify it runs without crashing
    const http = require('http');
    http.get('http://localhost:3003/logs/api', (res) => {
       res.setEncoding('utf8');
       let body = '';
       res.on('data', chunk => body += chunk);
       res.on('end', () => {
           console.log("Dashboard API responded successfully.");
           setTimeout(() => {
               server.close();
               process.exit(0);
           }, 500); // give time for testing locally and exiting
       });
    }).on('error', e => console.error(e));
});
