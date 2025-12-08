/**
 * Authentication & Authorization Middleware
 * Checks if user is logged in and has appropriate role
 */

// Check if user is authenticated (has session)
const isAuthenticated = (req, res, next) => {
  // Session-based authentication check
  if (req.session && req.session.userId) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Please log in.'
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'Forbidden. Admin access required.'
  });
};

// Check if user is site manager
const isSiteManager = (req, res, next) => {
  if (req.session && req.session.role === 'sitemanager') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'Forbidden. Site Manager access required.'
  });
};

// Check if user is either admin or site manager (authenticated user)
const isAdminOrSiteManager = (req, res, next) => {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'sitemanager')) {
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
