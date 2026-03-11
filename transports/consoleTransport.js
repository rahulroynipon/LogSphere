// consoleTransport.js - A beautiful, colorized terminal logger transport

const { format } = require('date-fns');

// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Map log levels to colors and icons
const levelConfig = {
  DEBUG: { color: colors.gray, icon: '🐛' },
  INFO:  { color: colors.blue, icon: 'ℹ️ ' },
  WARN:  { color: colors.yellow, icon: '⚠️ ' },
  ERROR: { color: colors.red, icon: '❌' },
};

/**
 * Transforms standard node stack trace file paths into clickable VS Code links.
 * Works nicely on iTerm2 and modern terminals.
 */
function formatStack(stack) {
  if (!stack) return '';
  return stack.split('\n').map(line => {
    // Look for lines like "at FunctionName (/path/to/file.js:10:32)"
    const pathMatch = line.match(/\((.*):(\d+):(\d+)\)/) || line.match(/at (.*):(\d+):(\d+)/);
    if (pathMatch) {
      const fullPath = pathMatch[1];
      const lineNum = pathMatch[2];
      const colNum = pathMatch[3];
      // Create clickable URL
      const vscodeUrl = `vscode://file${fullPath}:${lineNum}:${colNum}`;
      // Basic terminal link formatting (OSC 8 link syntax - may not be supported by all, but we provide URL text fallback)
      return line.replace(
        pathMatch[0],
        `(${colors.cyan}${vscodeUrl}${colors.reset})`
      );
    }
    return `${colors.gray}${line}${colors.reset}`;
  }).join('\n');
}

function write(logEntryString) {
  try {
    const entry = JSON.parse(logEntryString);
    const config = levelConfig[entry.level] || { color: colors.white, icon: '📝' };
    
    // Format timestamp nicely
    const timeStr = format(new Date(entry.timestamp), 'HH:mm:ss.SSS');
    
    // Build top line: [HH:mm:ss.SSS] ℹ️ INFO: Message
    let header = `${colors.dim}[${timeStr}]${colors.reset} ${config.icon} ${config.color}${colors.bold}${entry.level}${colors.reset}: ${colors.white}${entry.message}${colors.reset}`;
    
    // Optional Request ID or specific tags
    if (entry.meta && entry.meta.reqId) {
      header += ` ${colors.dim}[ReqID: ${entry.meta.reqId}]${colors.reset}`;
    }
    
    let output = header + '\n';
    
    // Print metadata neatly formatted
    const cleanMeta = { ...entry.meta };
    delete cleanMeta.stack;
    delete cleanMeta.errorMessage;
    delete cleanMeta.reqId; // Already printed above
    
    if (Object.keys(cleanMeta).length > 0) {
      const metaStr = JSON.stringify(cleanMeta, null, 2)
        .split('\n')
        .map(line => `  ${colors.dim}${line}${colors.reset}`)
        .join('\n');
      output += metaStr + '\n';
    }
    
    // Print formatted stack trace
    if (entry.stack) {
      output += formatStack(entry.stack) + '\n';
    }
    
    // Output based on level
    if (entry.level === 'ERROR') {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  } catch (err) {
    console.error('consoleTransport error:', err);
  }
}

module.exports = {
  write
};
