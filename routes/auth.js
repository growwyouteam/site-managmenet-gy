/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/authController');
const { loginValidation } = require('../middleware/validators');
const { isAuthenticated } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user (admin or site manager)
// @access  Public
router.post('/login', loginValidation, login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', isAuthenticated, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', isAuthenticated, getMe);

module.exports = router;
