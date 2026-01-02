/**
 * Production-Ready Error Handler
 * Consistent error responses and logging
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('❌ Production Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        const message = 'Database connection error';
        error = { message, statusCode: 503 };
    }

    // Rate limiting
    if (err.name === 'RateLimitError') {
        const message = 'Too many requests, please try again later';
        error = { message, statusCode: 429 };
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Production error response
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: error
        }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error helper
const validationError = (message, field) => {
    const error = new Error(message);
    error.statusCode = 400;
    error.field = field;
    return error;
};

// Not found handler
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = {
    errorHandler,
    asyncHandler,
    validationError,
    notFound
};
