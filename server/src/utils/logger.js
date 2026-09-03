/**
 * Logging Utility
 * 
 * Centralized logging for backend operations.
 * Provides structured logging with timestamps and log levels.
 * 
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('Delivery created', { deliveryId, userId });
 *   logger.error('Auth failed', new Error('Invalid token'));
 *   logger.warn('Rider reassigned', { deliveryId, oldRider, newRider });
 *   logger.debug('Database query', { query });
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',  // reset
};

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, data) {
  const timestamp = formatTimestamp();
  const color = COLORS[level] || '';
  const reset = COLORS.reset;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${dataStr}`;
}

function log(level, message, data) {
  if (LEVELS[level] < LEVELS[LOG_LEVEL]) {
    return; // Skip if below current log level
  }

  const formatted = formatMessage(level, message, data);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

const logger = {
  debug: (message, data) => log('debug', message, data),
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),

  /**
   * Log an error with stack trace
   */
  errorWithStack: (message, error) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      details: error.details || null,
    };
    log('error', message, errorData);
  },

  /**
   * Log a request (useful for middleware)
   */
  request: (method, path, status, duration) => {
    const statusColor =
      status >= 500 ? COLORS.error : status >= 400 ? COLORS.warn : COLORS.info;
    const data = { status, durationMs: duration };
    log('info', `${method} ${path}`, data);
  },

  /**
   * Log a database operation
   */
  db: (operation, table, duration, success) => {
    const data = { table, durationMs: duration, success };
    log('debug', `DB ${operation}`, data);
  },
};

module.exports = logger;
