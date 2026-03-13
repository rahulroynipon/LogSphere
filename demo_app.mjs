import express from 'express';
import { dashboard, expressLogger, info, warn, error } from './index.js';

const app = express();
const port = 3000;

// 1. Setup Logger
app.use(expressLogger({
  logBody: true,
  logQuery: true,
  excludePaths: ['/logs']
}));

// 2. Setup Protected Dashboard
app.use('/logs', dashboard({
  username: 'admin',
  password: 'password123'
}));

app.get('/', (req, res) => {
  info("Home page accessed", { user: "tester", ip: req.ip });
  res.send('<h1>LogSphere Demo</h1><p>Check the <a href="/logs">Dashboard</a></p>');
});

app.get('/trigger-logs', (req, res) => {
  info("Manual log triggered");
  warn("This is a warning log");
  error("This is an error log", new Error("Simulated Database Error"));
  res.send('Logs triggered! <a href="/logs">Go to Dashboard</a>');
});

app.get('/trigger-error', (req, res) => {
  error("This is an error log", new Error("Simulated Database Error"));
  res.send('Error triggered! <a href="/logs">Go to Dashboard</a>');
});

app.get("/user/:name", (req, res) => {
  res.send('<h1>Rahul</h1><p>Check the <a href="/logs">Dashboard</a></p>');
});

app.listen(port, () => {
  console.log(`Demo app listening at http://localhost:${port}`);
  console.log(`Access dashboard at http://localhost:${port}/logs (User: admin, Pass: password123)`);
});
