# Contributing to LogSphere 🪐

First off, thank you for considering contributing to LogSphere! It's people like you that make LogSphere such a great tool.

## 🌈 How Can I Contribute?

### 🐞 Reporting Bugs
- Use the [GitHub issue tracker](https://github.com/rahulroynipon/LogSphere/issues).
- We provide a **Bug Report Template**—please fill it out completely to help us fix the issue faster.
- Include your Node.js version, LogSphere version, and OS.

### 💡 Suggesting Enhancements
- Check if the feature has already been suggested in the [Issues](https://github.com/rahulroynipon/LogSphere/issues) tab.
- Use our **Feature Request Template** to describe your proposal, why it's needed, and how it should work.

---

## 🏗️ Project Structure

To help you navigate the codebase, here is a quick overview:

```text
LogSphere/
├── dashboard/           # Web Dashboard frontend files
│   ├── assets/          # Images for documentation
│   └── index.html       # Single-page Dashboard UI (Vanilla HTML/JS)
├── transports/          # Different output methods
│   ├── consoleTransport.js  # Beautiful CLI output
│   ├── fileTransport.js     # Rotating log file logic
│   └── remoteTransport.js   # HTTP/Webhook alerting (Discord)
├── .github/             # GitHub workflow & issue templates
├── index.js             # Main package entry point
├── logger.js            # Core logging engine & configuration
├── expressLogger.js     # Middleware for Express.js
├── dashboard.js         # Backend router for the Dashboard
├── index.d.ts           # TypeScript type definitions
├── CHANGELOG.md         # History of all version changes
└── README.md            # Main documentation
```

### Pull Requests
1. **Fork the repository** and create your branch from `main`.
2. **Setup your environment** (see [Development Setup](#development-setup)).
3. **Commit Messages**: Use clear, descriptive commit messages (e.g., `feat: add Slack notification support`).
4. **Make your changes**. If adding a feature, please include a test case.
5. **Run tests**: Ensure your changes don't break existing functionality.
6. **Submit a Pull Request** with a clear description and link to any related issues.

## 🏗️ Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/LogSphere.git
cd LogSphere

# Install dependencies
npm install
```

To test the dashboard during development:
1. Create a simple test file (e.g., `dev_test.js`).
2. Run it with `node dev_test.js`.
3. Open `http://localhost:3000/logs`.

## 📜 Code of Conduct
By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## 💎 Financial Contributions
If you find LogSphere useful, consider giving it a ⭐ on GitHub!
