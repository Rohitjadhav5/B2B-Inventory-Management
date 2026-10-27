const { ZodError } = require('zod');

// Generic Zod validation middleware factory
// schema: a Zod schema to validate against
// target: 'body' | 'query' | 'params'
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    // Replace req[target] with parsed/coerced values (e.g., page as number)
    req[target] = result.data;
    next();
  };
};

module.exports = { validate };
