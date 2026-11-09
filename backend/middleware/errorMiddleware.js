/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes in app.js.
 */
const errorHandler = (err, req, res, _next) => {
    console.error('❌', err.stack || err.message);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        return res.status(400).json({ message: `Duplicate value for: ${field}` });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }

    const status = err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Internal Server Error',
    });
};

module.exports = errorHandler;
