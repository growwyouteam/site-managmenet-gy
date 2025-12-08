/**
 * Admin Routes
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const {
  projectValidation,
  userValidation,
  machineValidation,
  stockValidation,
  vendorValidation,
  expenseValidation
} = require('../middleware/validators');

const {
  getDashboard,
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getStocks,
  createStock,
  updateStock,
  deleteStock,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  recordVendorPayment,
  getExpenses,
  createExpense,
  deleteExpense,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getTransfers,
  createTransfer,
  getAccounts,
  addCapital,
  addTransaction,
  generateReport,
  getAttendance,
  getLabourAttendance,
  getNotifications,
  sendNotification,
  markNotificationRead,
  getLabours
} = require('../controllers/adminController');

// Apply admin middleware to all routes
router.use(isAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Projects
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectDetail);
router.post('/projects', projectValidation, createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Machines
router.get('/machines', getMachines);
router.post('/machines', machineValidation, createMachine);
router.put('/machines/:id', updateMachine);
router.delete('/machines/:id', deleteMachine);

// Stock
router.get('/stocks', getStocks);
router.post('/stocks', stockValidation, createStock);
router.put('/stocks/:id', updateStock);
router.delete('/stocks/:id', deleteStock);

// Vendors
router.get('/vendors', getVendors);
router.post('/vendors', vendorValidation, createVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);
router.post('/vendors/payment', recordVendorPayment);

// Expenses
router.get('/expenses', getExpenses);
router.post('/expenses', expenseValidation, createExpense);
router.delete('/expenses/:id', deleteExpense);

// Users (Site Managers)
router.get('/users', getUsers);
router.post('/users', userValidation, createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Transfers
router.get('/transfers', getTransfers);
router.post('/transfers', createTransfer);

// Accounts
router.get('/accounts', getAccounts);
router.post('/accounts/capital', addCapital);
router.post('/accounts/transaction', addTransaction);

// Reports
router.get('/reports', generateReport);

// Attendance
router.get('/attendance', getAttendance);
router.get('/labour-attendance', getLabourAttendance);

// Labours
router.get('/labours', getLabours);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications', sendNotification);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
