const express = require('express');
const LogSphere = require('./index');

const app = express();
app.use(express.json());

app.use(LogSphere.expressLogger({
    logBody: true,
    logHeaders: true
}));

app.use('/logs', LogSphere.dashboard());

app.get('/trigger-error', (req, res) => {
    try {
        throw new Error("This is a simulated crash!");
    } catch(e) {
        LogSphere.error("System Failure Detected", e, { customId: 'A-123' });
        res.status(500).send("Crash logged, go check the dashboard.");
    }
});

app.listen(3003, () => {
    console.log("Server listening! Go to: http://localhost:3003/logs");
    LogSphere.info("Dashboard server started.");
});
