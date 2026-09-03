/**
 * Generic request-body validation middleware factory.
 *
 * Usage:
 *   validate({
 *     customer_name: { required: true, type: 'string' },
 *     customer_phone: { required: true, type: 'string' },
 *   })
 *
 * Rejects the request with 400 and a list of problems if any rule fails.
 * Does not replace frontend validation's UX role — this is the
 * authoritative, server-side check (PROJECT_SPEC.md §14, AI-RULES.md §5.5).
 */
function validate(rules) {
  return function (req, res, next) {
    const errors = [];

    for (const field of Object.keys(rules)) {
      const rule = rules[field];
      const value = req.body[field];

      const isMissing = value === undefined || value === null || value === '';

      if (rule.required && isMissing) {
        errors.push(`${field} is required`);
        continue;
      }

      if (!isMissing && rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be of type ${rule.type}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    next();
  };
}

module.exports = validate;