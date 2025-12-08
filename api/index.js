/**
 * Vercel Serverless Function Entry Point
 * This is a simplified version without Socket.IO (not supported on Vercel)
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const siteRoutes = require('../routes/site');

// Import middleware
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Initialize express app
const app = express();

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running on Vercel',
        timestamp: new Date().toISOString(),
        warning: 'Using in-memory storage - data will be lost on restart'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site', siteRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Construction Site Management API',
        version: '1.0.0'
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Export for Vercel
module.exports = app;
