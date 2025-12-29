/**
 * Authentication & Authorization Middleware
 * Checks if user is logged in via JWT token and has appropriate role
 */

const jwt = require('jsonwebtoken');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Check if user is authenticated (has valid JWT token)
const isAuthenticated = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden. Admin access required.'
  });
};

// Check if user is site manager
const isSiteManager = (req, res, next) => {
  if (req.user && req.user.role === 'sitemanager') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden. Site Manager access required.'
  });
};

// Check if user is either admin or site manager (authenticated user)
const isAdminOrSiteManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'sitemanager')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden. Access denied.'
  });
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isSiteManager,
  isAdminOrSiteManager
};
