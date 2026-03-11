// test_expressLogger.js - Test script for configurable expressLogger middleware

const express = require('express');
const logger = require('./logger');
const expressLogger = require('./expressLogger');

logger.initLogger();

const app = express();
app.use(express.json());

// Configure logger middleware for requests (with headers and body logged)
app.use(expressLogger({
  logHeaders: true,
  logBody: true,
  logQuery: true,
  excludePaths: ['/health']
}));

app.get('/health', (req, res) => {
  res.send('Should not log this path');
});

app.post('/login', (req, res) => {
  // Simulating authentication logic
  if (req.body.password && req.body.password === 'secret123') {
    logger.info('User authenticated successfully', { reqId: req.id, email: req.body.email });
    res.status(200).json({ token: 'abc-jwt-123' });
  } else {
    logger.warn('Failed login attempt', { reqId: req.id, email: req.body.email });
    res.status(401).send('Unauthorized');
  }
});

app.get('/error', (req, res) => {
  try {
    throw new Error('Something went wrong!');
  } catch (err) {
    logger.error('Unhandled error in /error route', err, { reqId: req.id });
    res.status(500).send('Internal Server Error');
  }
});

const PORT = 3000;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}\n`);
  
  // Hit routes automatically to test
  try {
    const http = require('http');

    const makeRequest = (options, postData = null) => {
      return new Promise((resolve) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        if (postData) {
          req.write(postData);
        }
        req.end();
      });
    };

    console.log('--- Testing /health (should be excluded) ---');
    await makeRequest({ hostname: 'localhost', port: PORT, path: '/health', method: 'GET' });

    console.log('\n--- Testing /login (success with redaction) ---');
    const postData = JSON.stringify({ email: 'user@test.com', password: 'secret123' });
    await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer test-token'
      }
    }, postData);

    console.log('\n--- Testing /error (trigger 500) ---');
    await makeRequest({ hostname: 'localhost', port: PORT, path: '/error', method: 'GET' });

  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(() => {
      console.log('\nTest finished, shutting down server.');
      server.close();
      process.exit(0);
    }, 1000); // give time for async logs
  }
});
