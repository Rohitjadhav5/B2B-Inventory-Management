// Centralized error handler – all thrown errors and next(err) calls land here.
// Returns consistent JSON: { success, message, errors? }
const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  // Mongoose duplicate key (e.g., duplicate email or product code)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const displayField = field === 'sku' ? 'product code' : field;
    return res.status(409).json({
      success: false,
      message: `Duplicate value: a record with this ${displayField} already exists.`,
    });
  }

  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

// 404 handler – must be registered AFTER all routes
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
};

module.exports = { errorHandler, notFound };
