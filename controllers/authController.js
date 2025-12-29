/**
 * Authentication Controller
 * Handles login, logout, and session management
 */

const { User } = require('../models');

// Login user (Admin or Site Manager)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase(), active: true });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Create session
    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;

    // Return user data (without password)
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData
      }
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
const getMe = async (req, res, next) => {
  try {
    // Check if session exists
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Find user from session
    const user = await User.findById(req.session.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
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
