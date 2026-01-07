import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Logger class
class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
    this.errorFile = path.join(logsDir, 'error.log');
  }

  #formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}\n`;
  }

  #writeToFile(file, message) {
    fs.appendFileSync(file, message, 'utf8');
  }

  #log(level, message, consoleLog = true) {
    const formattedMessage = this.#formatMessage(level, message);
    
    // Always write to app.log
    this.#writeToFile(this.logFile, formattedMessage);
    
    // Write errors to error.log
    if (level === LogLevel.ERROR) {
      this.#writeToFile(this.errorFile, formattedMessage);
    }
    
    // Console output
    if (consoleLog) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level] || ''}${formattedMessage.trim()}${reset}`);
    }
  }

  error(message) {
    this.#log(LogLevel.ERROR, message);
  }

  warn(message) {
    this.#log(LogLevel.WARN, message);
  }

  info(message) {
    this.#log(LogLevel.INFO, message);
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      this.#log(LogLevel.DEBUG, message);
    }
  }

  // Log HTTP requests
  logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
      
      if (res.statusCode >= 500) {
        this.error(message);
      } else if (res.statusCode >= 400) {
        this.warn(message);
      } else {
        this.info(message);
      }
    });
    
    next();
  }

  // Log database operations
  logDB(operation, collection, documentId, success = true, error = null) {
    const message = `DB ${operation} on ${collection}${documentId ? ` (${documentId})` : ''} ${success ? 'succeeded' : 'failed'}${error ? `: ${error.message}` : ''}`;
    
    if (success) {
      this.debug(message);
    } else {
      this.error(message);
    }
  }

  // Log authentication events
  logAuth(userId, action, success = true, ip = null) {
    const message = `AUTH ${action} for user ${userId} ${success ? 'succeeded' : 'failed'}${ip ? ` from ${ip}` : ''}`;
    
    if (success) {
      this.info(message);
    } else {
      this.warn(message);
    }
  }
}

export const logger = new Logger();
export default logger;