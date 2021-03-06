// eslint-disable-next-line no-console
const defaultLogger = console;
let currentLogger = defaultLogger;

const debugMode =
  process.env.DEBUG_PUPPETEER_SCENARIO ||
  (process.env.DEBUG && process.env.DEBUG.includes("puppeteer-scenario"));

export function debug(message, ...args) {
  if (debugMode && currentLogger) {
    currentLogger.log("puppeteer-scenario:", message, ...args);
  }
}

export function logError(message, ...args) {
  if (currentLogger) {
    currentLogger.error("puppeteer-scenario:", message, ...args);
  }
}

export function setLogger(logger) {
  currentLogger = logger;
}

export function resetLogger() {
  currentLogger = defaultLogger;
}
