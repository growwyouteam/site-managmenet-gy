/**
 * Admin Controller
 * Handles all admin-specific operations
 */

const bcrypt = require('bcryptjs');
const db = require('../db');

// ============ DASHBOARD ============

// Get dashboard summary
const getDashboard = (req, res, next) => {
  try {
    const totalProjects = db.projects.length;
    const runningProjects = db.projects.filter(p => p.status === 'running').length;
    const completedProjects = db.projects.filter(p => p.status === 'completed').length;
    const totalSiteManagers = db.users.filter(u => u.role === 'sitemanager' && u.active).length;
    const totalLabours = db.labours.filter(l => l.active).length;
    const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      data: {
        totalProjects,
        runningProjects,
        completedProjects,
        totalSiteManagers,
        totalLabours,
        totalExpenses,
        projects: db.projects
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ PROJECTS ============

// Get all projects
const getProjects = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: db.projects
    });
  } catch (error) {
    next(error);
  }
};

// Get single project detail
const getProjectDetail = (req, res, next) => {
  try {
    const { id } = req.params;
    const project = db.projects.find(p => p.id === id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get related data
    const expenses = db.expenses.filter(e => e.projectId === id);
    const stocks = db.stocks.filter(s => s.projectId === id);
    const labours = db.labours.filter(l => l.assignedSite === id);
    const attendance = db.attendance.filter(a => a.projectId === id);
    const dailyReports = db.dailyReports.filter(r => r.projectId === id);
    const gallery = db.gallery.filter(g => g.projectId === id);
    const manager = db.users.find(u => u.id === project.assignedManager);

    res.json({
      success: true,
      data: {
        project,
        expenses,
        stocks,
        labours,
        attendance,
        dailyReports,
        gallery,
        manager
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new project
const createProject = (req, res, next) => {
  try {
    const { name, location, startDate, endDate, budget, assignedManager, description } = req.body;

    const newProject = {
      id: db.generateId(),
      name,
      location,
      startDate,
      endDate: endDate || null,
      status: 'running',
      assignedManager: assignedManager || null,
      budget: parseFloat(budget),
      expenses: 0,
      description: description || '',
      createdAt: new Date()
    };

    db.projects.push(newProject);

    // Update site manager's assigned sites if manager is assigned
    if (assignedManager) {
      const manager = db.users.find(u => u.id === assignedManager);
      if (manager) {
        if (!manager.assignedSites) manager.assignedSites = [];
        manager.assignedSites.push(newProject.id);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    next(error);
  }
};

// Update project
const updateProject = (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const projectIndex = db.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Update project
    db.projects[projectIndex] = {
      ...db.projects[projectIndex],
      ...updates,
      id // Preserve ID
    };

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: db.projects[projectIndex]
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
const deleteProject = (req, res, next) => {
  try {
    const { id } = req.params;
    const projectIndex = db.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    db.projects.splice(projectIndex, 1);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ MACHINES ============

// Get all machines by category
const getMachines = (req, res, next) => {
  try {
    const { category } = req.query;

    if (category && db.machines[category]) {
      return res.json({
        success: true,
        data: db.machines[category]
      });
    }

    res.json({
      success: true,
      data: db.machines
    });
  } catch (error) {
    next(error);
  }
};

// Create machine
const createMachine = (req, res, next) => {
  try {
    const { name, category, quantity, assignedSite, status, remarks, unit } = req.body;

    if (!db.machines[category]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      });
    }

    const newMachine = {
      id: db.generateId(),
      name,
      category,
      quantity: parseInt(quantity),
      assignedSite: assignedSite || null,
      status: status || 'available',
      remarks: remarks || '',
      unit: unit || 'units',
      createdAt: new Date()
    };

    db.machines[category].push(newMachine);

    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      data: newMachine
    });
  } catch (error) {
    next(error);
  }
};

// Update machine
const updateMachine = (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let found = false;
    let updatedMachine = null;

    // Search in all categories
    for (const category in db.machines) {
      const machineIndex = db.machines[category].findIndex(m => m.id === id);
      if (machineIndex !== -1) {
        db.machines[category][machineIndex] = {
          ...db.machines[category][machineIndex],
          ...updates,
          id // Preserve ID
        };
        updatedMachine = db.machines[category][machineIndex];
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: updatedMachine
    });
  } catch (error) {
    next(error);
  }
};

// Delete machine
const deleteMachine = (req, res, next) => {
  try {
    const { id } = req.params;

    let found = false;

    // Search in all categories
    for (const category in db.machines) {
      const machineIndex = db.machines[category].findIndex(m => m.id === id);
      if (machineIndex !== -1) {
        db.machines[category].splice(machineIndex, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ STOCK ============

// Get all stocks
const getStocks = (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (projectId) {
      const stocks = db.stocks.filter(s => s.projectId === projectId);
      return res.json({
        success: true,
        data: stocks
      });
    }

    res.json({
      success: true,
      data: db.stocks
    });
  } catch (error) {
    next(error);
  }
};

// Create stock
const createStock = (req, res, next) => {
  try {
    const { projectId, materialName, unit, quantity, remarks } = req.body;

    const newStock = {
      id: db.generateId(),
      projectId,
      materialName,
      unit,
      quantity: parseFloat(quantity),
      remarks: remarks || '',
      addedBy: req.session.userId,
      createdAt: new Date()
    };

    db.stocks.push(newStock);

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: newStock
    });
  } catch (error) {
    next(error);
  }
};

// Update stock
const updateStock = (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const stockIndex = db.stocks.findIndex(s => s.id === id);

    if (stockIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    db.stocks[stockIndex] = {
      ...db.stocks[stockIndex],
      ...updates,
      id
    };

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: db.stocks[stockIndex]
    });
  } catch (error) {
    next(error);
  }
};

// Delete stock
const deleteStock = (req, res, next) => {
  try {
    const { id } = req.params;
    const stockIndex = db.stocks.findIndex(s => s.id === id);

    if (stockIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    db.stocks.splice(stockIndex, 1);

    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ VENDORS ============

// Get all vendors
const getVendors = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: db.vendors
    });
  } catch (error) {
    next(error);
  }
};

// Create vendor
const createVendor = (req, res, next) => {
  try {
    const { name, contact, email, materialsSupplied } = req.body;

    const newVendor = {
      id: db.generateId(),
      name,
      contact,
      email: email || '',
      materialsSupplied: materialsSupplied || [],
      pendingAmount: 0,
      totalSupplied: 0,
      createdAt: new Date()
    };

    db.vendors.push(newVendor);

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: newVendor
    });
  } catch (error) {
    next(error);
  }
};

// Update vendor
const updateVendor = (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const vendorIndex = db.vendors.findIndex(v => v.id === id);

    if (vendorIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    db.vendors[vendorIndex] = {
      ...db.vendors[vendorIndex],
      ...updates,
      id
    };

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: db.vendors[vendorIndex]
    });
  } catch (error) {
    next(error);
  }
};

// Delete vendor
const deleteVendor = (req, res, next) => {
  try {
    const { id } = req.params;
    const vendorIndex = db.vendors.findIndex(v => v.id === id);

    if (vendorIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    db.vendors.splice(vendorIndex, 1);

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Record vendor payment
const recordVendorPayment = (req, res, next) => {
  try {
    const { vendorId, amount, paymentMode, remarks } = req.body;

    const vendor = db.vendors.find(v => v.id === vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Reduce pending amount
    vendor.pendingAmount = Math.max(0, vendor.pendingAmount - parseFloat(amount));

    // Record in accounts
    const transaction = {
      id: db.generateId(),
      type: 'vendor_payment',
      vendorId,
      vendorName: vendor.name,
      amount: parseFloat(amount),
      paymentMode: paymentMode || 'cash',
      remarks: remarks || '',
      recordedBy: req.session.userId,
      createdAt: new Date()
    };

    if (paymentMode === 'bank') {
      db.accounts.bankTransactions.push(transaction);
    } else {
      db.accounts.cashTransactions.push(transaction);
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: { vendor, transaction }
    });
  } catch (error) {
    next(error);
  }
};

// ============ EXPENSES ============

// Get all expenses
const getExpenses = (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (projectId) {
      const expenses = db.expenses.filter(e => e.projectId === projectId);
      return res.json({
        success: true,
        data: expenses
      });
    }

    res.json({
      success: true,
      data: db.expenses
    });
  } catch (error) {
    next(error);
  }
};

// Create expense (admin can also add)
const createExpense = (req, res, next) => {
  try {
    const { projectId, name, amount, voucherNumber, remarks, slipImage } = req.body;

    const newExpense = {
      id: db.generateId(),
      projectId,
      name,
      amount: parseFloat(amount),
      voucherNumber: voucherNumber || '',
      remarks: remarks || '',
      slipImage: slipImage || null,
      addedBy: req.session.userId,
      createdAt: new Date()
    };

    db.expenses.push(newExpense);

    // Update project expenses
    const project = db.projects.find(p => p.id === projectId);
    if (project) {
      project.expenses = (project.expenses || 0) + parseFloat(amount);
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: newExpense
    });
  } catch (error) {
    next(error);
  }
};

// Delete expense
const deleteExpense = (req, res, next) => {
  try {
    const { id } = req.params;
    const expenseIndex = db.expenses.findIndex(e => e.id === id);

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    const expense = db.expenses[expenseIndex];

    // Update project expenses
    const project = db.projects.find(p => p.id === expense.projectId);
    if (project) {
      project.expenses = Math.max(0, (project.expenses || 0) - expense.amount);
    }

    db.expenses.splice(expenseIndex, 1);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ USERS (Site Managers) ============

// Get all users
const getUsers = (req, res, next) => {
  try {
    const { role } = req.query;

    let users = db.users;

    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);

    res.json({
      success: true,
      data: safeUsers
    });
  } catch (error) {
    next(error);
  }
};

// Create site manager
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, salary, assignedSites } = req.body;

    // Check if email already exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: db.generateId(),
      name,
      email,
      password: hashedPassword,
      role: 'sitemanager',
      phone: phone || '',
      salary: parseFloat(salary) || 0,
      assignedSites: assignedSites || [],
      active: true,
      createdAt: new Date()
    };

    db.users.push(newUser);

    // Remove password from response
    const { password: _, ...userData } = newUser;

    res.status(201).json({
      success: true,
      message: 'Site manager created successfully',
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...updates,
      id
    };

    // Remove password from response
    const { password, ...userData } = db.users[userIndex];

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Delete/Deactivate user
const deleteUser = (req, res, next) => {
  try {
    const { id } = req.params;
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting admin
    if (db.users[userIndex].role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete admin user'
      });
    }

    // Deactivate instead of delete
    db.users[userIndex].active = false;

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============ TRANSFERS ============

// Get all transfers
const getTransfers = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: db.transfers
    });
  } catch (error) {
    next(error);
  }
};

// Create transfer
const createTransfer = (req, res, next) => {
  try {
    const { type, itemId, fromProject, toProject, quantity, remarks } = req.body;

    const newTransfer = {
      id: db.generateId(),
      type, // 'labour', 'machine', 'stock'
      itemId,
      fromProject,
      toProject,
      quantity: quantity || 1,
      remarks: remarks || '',
      status: 'completed',
      transferredBy: req.session.userId,
      createdAt: new Date()
    };

    // Update item assignment based on type
    if (type === 'labour') {
      const labour = db.labours.find(l => l.id === itemId);
      if (labour) {
        labour.assignedSite = toProject;
        // Keep attendance history linked to labourId
      }
    } else if (type === 'machine') {
      // Search in all machine categories
      for (const category in db.machines) {
        const machine = db.machines[category].find(m => m.id === itemId);
        if (machine) {
          machine.assignedSite = toProject;
          break;
        }
      }
    } else if (type === 'stock') {
      const stock = db.stocks.find(s => s.id === itemId);
      if (stock) {
        // Reduce from source
        stock.quantity -= parseFloat(quantity);
        
        // Add to destination
        const newStock = {
          id: db.generateId(),
          projectId: toProject,
          materialName: stock.materialName,
          unit: stock.unit,
          quantity: parseFloat(quantity),
          remarks: `Transferred from ${fromProject}`,
          addedBy: req.session.userId,
          createdAt: new Date()
        };
        db.stocks.push(newStock);
      }
    }

    db.transfers.push(newTransfer);

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: newTransfer
    });
  } catch (error) {
    next(error);
  }
};

// ============ ACCOUNTS ============

// Get accounts summary
const getAccounts = (req, res, next) => {
  try {
    const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBankTransactions = db.accounts.bankTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCashTransactions = db.accounts.cashTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        capital: db.accounts.capital,
        totalExpenses,
        totalBankTransactions,
        totalCashTransactions,
        bankTransactions: db.accounts.bankTransactions,
        cashTransactions: db.accounts.cashTransactions,
        expenses: db.expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add capital
const addCapital = (req, res, next) => {
  try {
    const { amount } = req.body;
    db.accounts.capital += parseFloat(amount);

    res.json({
      success: true,
      message: 'Capital added successfully',
      data: { capital: db.accounts.capital }
    });
  } catch (error) {
    next(error);
  }
};

// Add transaction
const addTransaction = (req, res, next) => {
  try {
    const { type, amount, description, paymentMode } = req.body;

    const transaction = {
      id: db.generateId(),
      type,
      amount: parseFloat(amount),
      description: description || '',
      recordedBy: req.session.userId,
      createdAt: new Date()
    };

    if (paymentMode === 'bank') {
      db.accounts.bankTransactions.push(transaction);
    } else {
      db.accounts.cashTransactions.push(transaction);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// ============ REPORTS ============

// Generate reports
const generateReport = (req, res, next) => {
  try {
    const { type, startDate, endDate, projectId, managerId } = req.query;

    let data = {};

    // Filter by date range
    const filterByDate = (items) => {
      if (!startDate && !endDate) return items;
      return items.filter(item => {
        const itemDate = new Date(item.createdAt);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        return itemDate >= start && itemDate <= end;
      });
    };

    if (type === 'expenses') {
      let expenses = db.expenses;
      if (projectId) expenses = expenses.filter(e => e.projectId === projectId);
      expenses = filterByDate(expenses);
      data = { expenses };
    } else if (type === 'attendance') {
      let attendance = db.attendance;
      if (projectId) attendance = attendance.filter(a => a.projectId === projectId);
      if (managerId) attendance = attendance.filter(a => a.userId === managerId);
      attendance = filterByDate(attendance);
      data = { attendance };
    } else if (type === 'pl') {
      // Profit & Loss
      const totalRevenue = db.accounts.capital;
      const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = totalRevenue - totalExpenses;
      data = { totalRevenue, totalExpenses, profit };
    } else {
      // Full report
      data = {
        projects: db.projects,
        expenses: filterByDate(db.expenses),
        attendance: filterByDate(db.attendance),
        stocks: db.stocks,
        vendors: db.vendors
      };
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// ============ ATTENDANCE (View) ============

// Get all attendance records
const getAttendance = (req, res, next) => {
  try {
    const { projectId, userId } = req.query;

    let attendance = db.attendance;

    if (projectId) {
      attendance = attendance.filter(a => a.projectId === projectId);
    }

    if (userId) {
      attendance = attendance.filter(a => a.userId === userId);
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get labour attendance
const getLabourAttendance = (req, res, next) => {
  try {
    const { projectId, labourId } = req.query;

    let attendance = db.labourAttendance;

    if (projectId) {
      attendance = attendance.filter(a => a.projectId === projectId);
    }

    if (labourId) {
      attendance = attendance.filter(a => a.labourId === labourId);
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// ============ NOTIFICATIONS ============

// Get all notifications
const getNotifications = (req, res, next) => {
  try {
    // Admin sees all notifications
    const notifications = db.notifications.filter(n => 
      n.recipientRole === 'admin' || n.senderId === req.session.userId
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Send notification
const sendNotification = (req, res, next) => {
  try {
    const { recipientId, recipientRole, message, type } = req.body;

    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientId: recipientId || null,
      recipientRole: recipientRole || 'sitemanager',
      message,
      type: type || 'general',
      read: false,
      createdAt: new Date()
    };

    db.notifications.push(notification);

    // Emit socket event (handled in server.js)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      if (recipientId) {
        io.to(recipientId).emit('notification', notification);
      } else {
        io.emit('notification', notification);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markNotificationRead = (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = db.notifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.read = true;

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Get all labours (for admin view)
const getLabours = (req, res, next) => {
  try {
    const { projectId } = req.query;

    let labours = db.labours;

    if (projectId) {
      labours = labours.filter(l => l.assignedSite === projectId);
    }

    res.json({
      success: true,
      data: labours
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
