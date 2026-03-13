# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-14

### Added
- **Premium Dashboard UI**: Redesigned header with glassmorphism effects and better layout.
- **Smart Filter Persistence**: Dashboard filters now stay active during auto-refreshes.
- **Custom Modals**: Replaced native browser alerts with premium modals for Login, Logout, and Clear Logs.
- **Route Exclusion**: Added `excludePaths` option to `expressLogger` to skip noisy routes.
- **Log Level Threshold**: Added `minLevel` configuration to filter log volume globally.
- **Improved UI Elements**: Enhanced button styles, better spacing, and responsive header.
- **Enhanced Reliability**: Dashboard now automatically suppresses internal recursive logging.

## [1.0.0] - 2026-03-12

### Added
- Initial release of LogSphere.
- Professional console logging with icons and colors.
- Express middleware for automatic request/response logging.
- Advanced sensitive data redaction.
- File transport with daily rotation and gzip compression.
- Developer Web Dashboard with Search, Filter, and Live Tailing.
- Dark, Light, and System theme support in the Dashboard.
- Export logs to CSV feature.
- Discord Webhook integration for critical error alerts.
- Performance metrics (Slow Request detection).
- Secure Dashboard with Basic Auth support.
- Full TypeScript support with `index.d.ts`.
- Professional documentation and contribution guidelines.
