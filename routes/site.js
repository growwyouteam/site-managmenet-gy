/**
 * Site Manager Routes
 * All routes require site manager authentication
 */

const express = require('express');
const router = express.Router();
const { isSiteManager } = require('../middleware/auth');
const {
  labourValidation,
  attendanceValidation,
  expenseValidation
} = require('../middleware/validators');

const {
  getDashboard,
  markAttendance,
  getMyAttendance,
  getLabours,
  enrollLabour,
  updateLabour,
  markLabourAttendance,
  getLabourAttendance,
  addStockIn,
  getStocks,
  submitDailyReport,
  getDailyReports,
  uploadGalleryImages,
  getGalleryImages,
  addExpense,
  getExpenses,
  requestTransfer,
  getTransfers,
  payLabour,
  getPayments,
  getNotifications,
  markNotificationRead,
  getProfile,
  getVendors,
  getProjects
} = require('../controllers/siteController');

// Apply site manager middleware to all routes
router.use(isSiteManager);

// Dashboard
router.get('/dashboard', getDashboard);

// Attendance (Site Manager's own)
router.post('/attendance', attendanceValidation, markAttendance);
router.get('/attendance', getMyAttendance);

// Labour
router.get('/labours', getLabours);
router.post('/labours', labourValidation, enrollLabour);
router.put('/labours/:id', updateLabour);

// Labour Attendance
router.post('/labour-attendance', markLabourAttendance);
router.get('/labour-attendance', getLabourAttendance);

// Stock In
router.post('/stock-in', addStockIn);
router.get('/stocks', getStocks);

// Daily Report
router.post('/daily-report', submitDailyReport);
router.get('/daily-reports', getDailyReports);

// Gallery
router.post('/gallery', uploadGalleryImages);
router.get('/gallery', getGalleryImages);

// Expenses
router.post('/expenses', expenseValidation, addExpense);
router.get('/expenses', getExpenses);

// Transfer
router.post('/transfer', requestTransfer);
router.get('/transfers', getTransfers);

// Payment
router.post('/payment', payLabour);
router.get('/payments', getPayments);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Profile
router.get('/profile', getProfile);

// Vendors (for dropdown)
router.get('/vendors', getVendors);

// Projects (assigned)
router.get('/projects', getProjects);

module.exports = router;
