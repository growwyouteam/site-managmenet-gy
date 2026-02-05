/**
 * Authentication Controller
 * Handles login, logout, and JWT token management
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Generate JWT token
const generateToken = (userId, role, name, email) => {
  return jwt.sign(
    { userId, role, name, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

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

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      user.role,
      user.name,
      user.email
    );

    // Return user data (without password) and token
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = (req, res, next) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // Server doesn't need to do anything
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user info
const getMe = async (req, res, next) => {
  try {
    // User is already attached to req by auth middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Find user from token data
    const user = await User.findById(req.user.userId).select('-password');

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
