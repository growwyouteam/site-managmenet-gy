/**
 * Vercel Serverless Function Entry Point
 * This is a simplified version without Socket.IO (not supported on Vercel)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import MongoDB connection
const connectDB = require('../config/database');

// Connect to MongoDB
connectDB();

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

// CORS configuration - Allow all origins in production for Vercel
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
