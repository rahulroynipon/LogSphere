// test_package.js
const express = require('express');
const LogSphere = require('./index');

// 1. Configure the logger (Optional but recommended)
LogSphere.configure({
  sensitiveKeys: ['mySecretPassword', 'apiKey', 'creditCard'], // Custom redaction
  enableFileLogs: false, // Turn off file logs for this test
  enableRemoteLogs: false
});

// 2. Standup a quick server
const app = express();
app.use(express.json());

// 3. Inject the middleware instantly
app.use(LogSphere.expressLogger({ logBody: true }));

app.post('/test', (req, res) => {
  // 4. Use LogSphere directly!
  LogSphere.info('Processing /test request', { userId: 999 });
  
  if (req.body.mySecretPassword === '123') {
    LogSphere.warn('Weak password detected!', { password: req.body.mySecretPassword });
  }

  res.send('Done');
});

const server = app.listen(3001, async () => {
  LogSphere.info('Test plug-and-play server running on 3001');

  try {
    const http = require('http');
    const postData = JSON.stringify({ username: 'bob', mySecretPassword: '123', creditCard: '4555-1111' });

    await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/test',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.write(postData);
      req.end();
    });

  } catch(e) {
    LogSphere.error('Test failed', e);
  } finally {
    server.close();
  }
});
