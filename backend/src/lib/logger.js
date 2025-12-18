// lib/logger.js
// Simple JSON logger for Lambda functions

export const logger = {
  info: (data) => {
    console.log(JSON.stringify({ level: "info", ...data }));
  },
  error: (data) => {
    console.error(JSON.stringify({ level: "error", ...data }));
  },
  warn: (data) => {
    console.warn(JSON.stringify({ level: "warn", ...data }));
  },
};
