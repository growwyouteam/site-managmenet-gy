/**
 * Authentication Controller
 * Handles login, logout, and session management
 */

const bcrypt = require('bcryptjs');
const db = require('../db');

// Login user (Admin or Site Manager)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = db.users.find(u => u.email === email && u.active);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;

    // Return user data (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = (req, res, next) => {
  try {
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to logout'
        });
      }

      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });

  } catch (error) {
    next(error);
  }
};

// Get current user info
const getMe = (req, res, next) => {
  try {
    // Check if session exists
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Find user from session
    const user = db.users.find(u => u.id === req.session.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user data (without password)
    const { password, ...userData } = user;

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe
};
