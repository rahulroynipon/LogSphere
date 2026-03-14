const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
// Import from our symlinked local package
const { configure, expressLogger, dashboard, info, error } = require('logsphere');

const app = express();

// 1. Global Configuration
// Testing custom logDir and singular 'logBodys' misspelling support
configure({
  logDir: path.join(__dirname, 'custom-logs'),
  logBodys: true, // Testing misspelling support
  logHeaders: true,
  logResponse: true, // Enable response logging
  sensitiveKeys: ['password', 'card_number'],
  excludePaths: ['/dashboard']
});

// 2. Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// 3. Logger Middleware (No options passed, should inherit from configure)
app.use(expressLogger());

// 4. Test Routes
app.get('/', (req, res) => {
  info('Home page visited');
  res.send('LogSphere Test Server is running!');
});

app.post('/api/test', (req, res) => {
  info('Post test endpoint hit', { received: req.body });
  res.json({ success: true, your_data: req.body });
});

app.get('/api/response', (req, res) => {
  // Using the structure requested by the user
  const response = {
    status: 200,
    statusText: "SUCCESS",
    message: "Data fetched successfully",
    payload: {
      users: [
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Doe" }
      ]
    }
  };
  res.json(response);
});

app.get('/error', (req, res) => {
  try {
    throw new Error('This is a simulated crash');
  } catch (err) {
    error('Caught an error in /error route', err, { extra: 'context' });
    res.status(500).send('Something went wrong');
  }
});

// 5. Dashboard
app.use('/dashboard', dashboard({
  username: 'admin',
  password: 'password123'
}));

const PORT = 3344;
app.listen(PORT, () => {
  console.log(`\n🚀 Test Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`);
  console.log(`📂 Logs will be in: ${path.join(__dirname, 'custom-logs')}\n`);
});
