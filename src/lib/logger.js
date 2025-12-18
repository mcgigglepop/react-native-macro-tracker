// lib/logger.js
// Centralized logging utility for structured JSON logs

/**
 * Logger class for structured JSON logging
 */
class Logger {
  /**
   * Log an info-level message
   * @param {Object} data - Log data object
   */
  info(data) {
    console.log(JSON.stringify({
      level: "info",
      ...data,
    }));
  }

  /**
   * Log a warn-level message
   * @param {Object} data - Log data object
   */
  warn(data) {
    console.warn(JSON.stringify({
      level: "warn",
      ...data,
    }));
  }

  /**
   * Log an error-level message
   * @param {Object} data - Log data object
   */
  error(data) {
    console.error(JSON.stringify({
      level: "error",
      ...data,
    }));
  }

  /**
   * Log a debug-level message (alias for info)
   * @param {Object} data - Log data object
   */
  debug(data) {
    this.info({ ...data, level: "debug" });
  }
}

// Export a singleton instance
export const logger = new Logger();

// Also export the class for cases where multiple logger instances might be needed
export { Logger };

