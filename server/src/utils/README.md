# Utils Directory

This directory contains shared utility modules used across the backend.

## Modules

### `logger.js` — Structured Logging (D2-13)

**Purpose:** Centralized logging with timestamps, log levels, and color-coded console output.

**Features:**
- Log levels: `debug`, `info`, `warn`, `error`
- Colored console output for quick visual scanning
- ISO 8601 timestamps on every log
- Support for structured data logging

**Usage:**
```javascript
const logger = require('../utils/logger');

// Basic logging
logger.info('Delivery created', { deliveryId: '123', userId: 'user-456' });
logger.warn('Rider reassigned', { old: 'rider1', new: 'rider2' });
logger.error('Database connection failed');

// Error with stack trace
logger.errorWithStack('Auth failed', new Error('Invalid token'));

// Request logging (middleware-friendly)
logger.request('GET', '/api/deliveries', 200, 45); // method, path, status, durationMs

// Database operations
logger.db('INSERT', 'deliveries', 150, true); // operation, table, durationMs, success
```

**Configuration:**
Set `LOG_LEVEL` environment variable to control output verbosity:
```bash
LOG_LEVEL=debug   # Show all logs (most verbose)
LOG_LEVEL=info    # Default (recommended for production)
LOG_LEVEL=warn    # Only warnings and errors
LOG_LEVEL=error   # Only errors
```

**Example Output:**
```
[2024-01-15T10:30:45.123Z] [INFO] Delivery created { deliveryId: '123', userId: 'user-456' }
[2024-01-15T10:30:46.456Z] [WARN] Rider reassigned { old: 'rider1', new: 'rider2' }
[2024-01-15T10:30:47.789Z] [ERROR] Database connection failed
```

---

## Future Utilities (To Be Added)

### `cache.js` — In-Memory Caching
```javascript
// Planned: Memoize expensive queries
cache.get('delivery:123')
cache.set('delivery:123', data, 300) // 5 min TTL
```

### `metrics.js` — Performance Monitoring
```javascript
// Planned: Track request latency, error rates, database performance
metrics.recordLatency('/api/deliveries', 45)
metrics.recordError('auth_failed')
```

### `validators.js` — Data Validation Helpers
```javascript
// Already exists in validators/validate.js
// Could extend with more specific validators here
```

### `formatters.js` — Response Formatting
```javascript
// Planned: Standardize response envelope
const envelope = formatters.success(data, message)
const error = formatters.error(statusCode, message)
```

---

## Integration Examples

### In Middleware
```javascript
// logs/middleware.js
const logger = require('../utils/logger');

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.path, res.statusCode, duration);
  });
  next();
});
```

### In Services
```javascript
// services/deliveryService.js
const logger = require('../utils/logger');

async function createDelivery(data) {
  logger.debug('Creating delivery', { customer: data.customer_name });
  const delivery = await db.insert('deliveries', data);
  logger.info('Delivery created', { deliveryId: delivery.id });
  return delivery;
}
```

### In Error Handler
```javascript
// middleware/errorHandler.js
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.errorWithStack(`${req.method} ${req.path}`, err);
  res.status(err.status || 500).json({ error: err.message });
}
```

---

## Adding New Utilities

When adding new utility modules:

1. **Place in `server/src/utils/`**
2. **Export as CommonJS module:** `module.exports = { ... }`
3. **Document in this README**
4. **Use consistent naming:** snake_case.js
5. **Include JSDoc comments** for all exported functions
6. **Keep modules focused** (single responsibility principle)

Example template:
```javascript
/**
 * Utility Name
 * 
 * Purpose: One-line description
 * 
 * Usage:
 *   const util = require('../utils/utility-name');
 *   util.doSomething();
 */

// Implementation here

module.exports = {
  doSomething: () => { ... },
};
```

---

## Performance Considerations

- **Logger:** Minimal overhead; production-safe
- **Logging in tight loops:** Avoid; can degrade performance
- **Log output:** Console output is buffered; won't block code execution

## Testing Utilities

Run unit tests for utilities:
```bash
npm test -- utils/
```

---

Last Updated: 2024-09-02
Utilities Count: 1 (logger)
