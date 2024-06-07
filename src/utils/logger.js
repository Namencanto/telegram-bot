import fs from 'fs';
import path from 'path';

const logDirectory = path.resolve('logs');
const logFilePath = path.join(logDirectory, 'app.log');

// Ensure the logs directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const formatMessage = (...args) => {
  return args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`;
    }
    return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg;
  }).join(' ');
};

const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

const log = (...args) => {
  const message = formatMessage(...args);
  console.log(message);
  writeLog(message);
};

log.error = (...args) => {
  const message = formatMessage(...args);
  const redMessage = `\x1b[31m${message}\x1b[0m`;
  console.error(redMessage);
  writeLog(message);
};

export default log;
