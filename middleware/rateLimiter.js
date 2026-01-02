/**
 * Production-Ready Rate Limiting
 * Prevents DoS attacks and API abuse
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Redis client for distributed rate limiting
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
});

// General API rate limiting
const generalLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes',
        retryAfter: 900
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
        return req.ip + ':' + (req.user?.userId || 'anonymous');
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again after 15 minutes',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':auth';
    },
    skipSuccessfulRequests: true // Don't count successful auth attempts
});

// Strict rate limiting for file uploads
const uploadLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: {
        success: false,
        error: 'Too many upload attempts, please try again after an hour',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':upload:' + (req.user?.userId || 'anonymous');
    }
});

// Database operation rate limiting
const dbLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 50 DB operations per minute
    message: {
        success: false,
        error: 'Too many database operations, please slow down',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':db:' + (req.user?.userId || 'anonymous');
    }
});

// User-specific rate limiting
const userLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each user to 30 requests per minute
    keyGenerator: (req) => {
        return 'user:' + (req.user?.userId || req.ip);
    },
    message: {
        success: false,
        error: 'User rate limit exceeded, please slow down',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip if no user is authenticated
        return !req.user;
    }
});

// Admin-specific rate limiting (more restrictive)
const adminLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Limit each admin to 100 requests per 5 minutes
    keyGenerator: (req) => {
        return 'admin:' + (req.user?.userId || req.ip);
    },
    message: {
        success: false,
        error: 'Admin rate limit exceeded, please slow down',
        retryAfter: 300
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip if user is not admin
        return !req.user || req.user.role !== 'admin';
    }
});

// Site manager specific rate limiting
const siteManagerLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 50, // Limit each site manager to 50 requests per 2 minutes
    keyGenerator: (req) => {
        return 'sitemanager:' + (req.user?.userId || req.ip);
    },
    message: {
        success: false,
        error: 'Site manager rate limit exceeded, please slow down',
        retryAfter: 120
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip if user is not site manager
        return !req.user || req.user.role !== 'sitemanager';
    }
});

// Cleanup Redis client on process exit
process.on('SIGTERM', () => {
    redisClient.quit();
});

process.on('SIGINT', () => {
    redisClient.quit();
});

module.exports = {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    dbLimiter,
    userLimiter,
    adminLimiter,
    siteManagerLimiter
};
