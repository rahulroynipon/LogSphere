# 🪐 LogSphere

[![npm version](https://img.shields.io/npm/v/logsphere.svg)](https://www.npmjs.com/package/logsphere)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**LogSphere** is a professional, industrial-grade logging system for Node.js and Express. It combines beautiful console visualization, high-performance file rotation, sensitive data redaction, and a **real-time Developer Web Dashboard** in one plug-and-play package.

---

## ✨ Features

- 🚀 **Plug-and-Play**: Setup in 2 lines of code.
- 📊 **Web Dashboard**: Built-in UI for searching, filtering, and live-tailing logs.
- 🛡️ **Security First**: Automatic redaction of passwords, tokens, and secrets.
- 🕒 **Log Rotation**: Automatic daily rotation and configurable retention policies.
- 🐌 **Performance Metrics**: Identifies slow requests automatically.
- 🔔 **Alerting**: Built-in support for Discord webhooks on critical errors.
- 📦 **NPM Ready**: Fully typed with TypeScript support.
- 🎨 **Beautiful UI**: Dark mode, light mode, and system theme support.

---

## 📸 Dashboard Preview

### Dark Mode (Default)
![Dashboard Dark](./dashboard/assets/screenshot-dark.png)

### Light Mode
![Dashboard Light](./dashboard/assets/screenshot-light.png)

---

## 🚀 Quick Start

### 1. Install

```bash
npm install logsphere
```

### 2. Basic Usage (Express)

#### CommonJS (Node.js)
```javascript
const express = require('express');
const LogSphere = require('logsphere');

const app = express();

// Setup the Logger Middleware
app.use(LogSphere.expressLogger({ logBody: true }));

// Setup the Web Dashboard
app.use('/logs', LogSphere.dashboard({
  username: 'admin',
  password: 'securePassword123' 
}));

app.listen(3000);
```

#### ESM (TypeScript / Modern Node)
```javascript
import express from 'express';
import { dashboard, expressLogger, info } from 'logsphere';

const app = express();

app.use(expressLogger());
app.use('/logs', dashboard());

app.get('/', (req, res) => {
  info("ESM Import Works!");
  res.send('Hello ESM!');
});

app.listen(3000);
```


---

## 🛠️ Configuration Options

LogSphere is highly configurable via `LogSphere.configure()` or directly inside the `expressLogger` middleware.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `logDir` | `string` | `'./logs'` | Custom path where log files will be stored. |
| `sensitiveKeys` | `string[]` | `['password', 'token', ...]` | Keys to redact in JSON logs automatically. |
| `maxLogFiles` | `number` | `false` | Max number of log files to keep (oldest are deleted). |
| `maxExpireDays` | `number` | `false` | Number of days to keep logs (deleted if older). |
| `discordWebhookUrl` | `string` | `null` | Discord URL to send critical error alerts. |
| `slowRequestThresholdMs` | `number` | `2000` | Threshold to flag and log slow requests. |
| `enableConsoleLogs` | `boolean` | `true` | Enable/Disable beautiful console output. |

---

## 📈 Developer Dashboard

Accessed via the route where you mount `LogSphere.dashboard()`, the UI provides:

- **Live Tailing**: Toggle "Auto Refresh" to see logs stream in real-time.
- **Advanced Search**: Filter by message, request ID, IP, or level.
- **Date Filtering**: Narrow down logs by specific date ranges.
- **Exporting**: One-click "CSV Export" for your filtered results.
- **Management**: One-click "Clear Logs" to reset your dev environment.
- **Expandable Details**: Click any log to see formatted JSON metadata and stack traces.

---

## 🩺 Direct Logging

You can use the logger anywhere in your application:

#### CommonJS
```javascript
const LogSphere = require('logsphere');
LogSphere.info("System status update");
```

#### ESM
```javascript
import { info, error, warn, debug } from 'logsphere';

debug("Debugging complex logic", { state: currentObj });
info("System status update");
warn("Low disk space warning");
error("Fatal Error occurred", new Error("Database timeout"), { db: "main_cluster" });
```


---

## 🔐 Security Best Practices

We recommend **always** using the built-in authentication for the dashboard in production environments:

```javascript
app.use('/logs', LogSphere.dashboard({
  username: process.env.LOG_USER,
  password: process.env.LOG_PASSWORD
}));
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's a bug report, feature request, or a pull request, we appreciate your help. Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

## 👤 Author

**Rahul Roy Nipon**

- **Email**: [rahulroynipon@gmail.com](mailto:rahulroynipon@gmail.com)
- **GitHub**: [@rahulroynipon](https://github.com/rahulroynipon)
- **LinkedIn**: [rahulroynipon](https://linkedin.com/in/rahulroynipon)

---

## 📄 License

MIT © [Rahul Roy Nipon](LICENSE)
