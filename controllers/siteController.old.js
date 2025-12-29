/**
 * Site Manager Controller
 * Handles all site manager-specific operations
 */

const db = require('../db');

// ============ DASHBOARD ============

// Get site manager dashboard
const getDashboard = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get assigned projects
    const assignedProjects = db.projects.filter(p => 
      user.assignedSites && user.assignedSites.includes(p.id)
    );

    // Get labour count
    const labourCount = db.labours.filter(l => 
      user.assignedSites && user.assignedSites.includes(l.assignedSite)
    ).length;

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = db.attendance.filter(a => 
      a.userId === userId && a.date.startsWith(today)
    );

    // Get notifications
    const notifications = db.notifications.filter(n => 
      n.recipientId === userId || n.recipientRole === 'sitemanager'
    ).slice(0, 5);

    res.json({
      success: true,
      data: {
        user: { ...user, password: undefined },
        assignedProjects,
        labourCount,
        todayAttendance,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ ATTENDANCE ============

// Mark attendance with photo
const markAttendance = (req, res, next) => {
  try {
    const { date, time, projectId, photo, remarks } = req.body;

    const attendance = {
      id: db.generateId(),
      userId: req.session.userId,
      userName: req.session.name,
      projectId,
      date,
      time: time || new Date().toISOString(),
      photo: photo || null, // Base64 or file path
      remarks: remarks || '',
      createdAt: new Date()
    };

    db.attendance.push(attendance);

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} marked attendance for ${projectId}`,
      type: 'attendance',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get my attendance
const getMyAttendance = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const attendance = db.attendance.filter(a => a.userId === userId);

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// ============ LABOUR ============

// Get labours for assigned sites
const getLabours = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user || !user.assignedSites) {
      return res.json({
        success: true,
        data: []
      });
    }

    const labours = db.labours.filter(l => 
      user.assignedSites.includes(l.assignedSite)
    );

    res.json({
      success: true,
      data: labours
    });
  } catch (error) {
    next(error);
  }
};

// Enroll new labour
const enrollLabour = (req, res, next) => {
  try {
    const { name, phone, dailyWage, designation, assignedSite } = req.body;

    const newLabour = {
      id: db.generateId(),
      name,
      phone,
      dailyWage: parseFloat(dailyWage),
      designation,
      assignedSite,
      enrolledBy: req.session.userId,
      active: true,
      pendingPayout: 0,
      createdAt: new Date()
    };

    db.labours.push(newLabour);

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} enrolled new labour: ${name}`,
      type: 'labour',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Labour enrolled successfully',
      data: newLabour
    });
  } catch (error) {
    next(error);
  }
};

// Update labour
const updateLabour = (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const labourIndex = db.labours.findIndex(l => l.id === id);

    if (labourIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Labour not found'
      });
    }

    db.labours[labourIndex] = {
      ...db.labours[labourIndex],
      ...updates,
      id
    };

    res.json({
      success: true,
      message: 'Labour updated successfully',
      data: db.labours[labourIndex]
    });
  } catch (error) {
    next(error);
  }
};

// ============ LABOUR ATTENDANCE ============

// Mark labour attendance
const markLabourAttendance = (req, res, next) => {
  try {
    const { labourId, date, time, projectId, photo, remarks } = req.body;

    const labour = db.labours.find(l => l.id === labourId);

    if (!labour) {
      return res.status(404).json({
        success: false,
        error: 'Labour not found'
      });
    }

    const attendance = {
      id: db.generateId(),
      labourId,
      labourName: labour.name,
      projectId,
      date,
      time: time || new Date().toISOString(),
      photo: photo || null,
      remarks: remarks || '',
      markedBy: req.session.userId,
      dailyWage: labour.dailyWage,
      createdAt: new Date()
    };

    db.labourAttendance.push(attendance);

    // Update labour pending payout
    labour.pendingPayout = (labour.pendingPayout || 0) + labour.dailyWage;

    res.status(201).json({
      success: true,
      message: 'Labour attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// Get labour attendance
const getLabourAttendance = (req, res, next) => {
  try {
    const { labourId, projectId } = req.query;
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    let attendance = db.labourAttendance;

    // Filter by assigned sites
    if (user && user.assignedSites) {
      attendance = attendance.filter(a => 
        user.assignedSites.includes(a.projectId)
      );
    }

    if (labourId) {
      attendance = attendance.filter(a => a.labourId === labourId);
    }

    if (projectId) {
      attendance = attendance.filter(a => a.projectId === projectId);
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// ============ STOCK IN ============

// Add stock in (material receipt from vendor)
const addStockIn = (req, res, next) => {
  try {
    const { projectId, vendorId, materialName, unit, quantity, vehiclePhoto, slipPhoto, remarks } = req.body;

    const vendor = db.vendors.find(v => v.id === vendorId);

    const stockIn = {
      id: db.generateId(),
      projectId,
      vendorId,
      vendorName: vendor ? vendor.name : 'Unknown',
      materialName,
      unit,
      quantity: parseFloat(quantity),
      vehiclePhoto: vehiclePhoto || null,
      slipPhoto: slipPhoto || null,
      remarks: remarks || '',
      addedBy: req.session.userId,
      createdAt: new Date()
    };

    // Add to stocks
    db.stocks.push(stockIn);

    // Update vendor if exists
    if (vendor) {
      if (!vendor.materialsSupplied.includes(materialName)) {
        vendor.materialsSupplied.push(materialName);
      }
    }

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} added stock: ${materialName} (${quantity} ${unit})`,
      type: 'stock',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: stockIn
    });
  } catch (error) {
    next(error);
  }
};

// Get stocks for assigned sites
const getStocks = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user || !user.assignedSites) {
      return res.json({
        success: true,
        data: []
      });
    }

    const stocks = db.stocks.filter(s => 
      user.assignedSites.includes(s.projectId)
    );

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
};

// ============ DAILY REPORT ============

// Submit daily report
const submitDailyReport = (req, res, next) => {
  try {
    const { projectId, reportType, description, photos } = req.body;

    const report = {
      id: db.generateId(),
      projectId,
      reportType, // 'morning' or 'evening'
      description,
      photos: photos || [], // Array of photo URLs/base64
      submittedBy: req.session.userId,
      submittedByName: req.session.name,
      createdAt: new Date()
    };

    db.dailyReports.push(report);

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} submitted ${reportType} report for ${projectId}`,
      type: 'report',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Daily report submitted successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Get daily reports
const getDailyReports = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user || !user.assignedSites) {
      return res.json({
        success: true,
        data: []
      });
    }

    const reports = db.dailyReports.filter(r => 
      user.assignedSites.includes(r.projectId)
    );

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// ============ GALLERY ============

// Upload gallery images
const uploadGalleryImages = (req, res, next) => {
  try {
    const { projectId, images, description } = req.body;

    const galleryItems = images.map(image => ({
      id: db.generateId(),
      projectId,
      image, // URL or base64
      description: description || '',
      uploadedBy: req.session.userId,
      uploadedByName: req.session.name,
      createdAt: new Date()
    }));

    db.gallery.push(...galleryItems);

    res.status(201).json({
      success: true,
      message: 'Images uploaded successfully',
      data: galleryItems
    });
  } catch (error) {
    next(error);
  }
};

// Get gallery images
const getGalleryImages = (req, res, next) => {
  try {
    const { projectId } = req.query;
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    let gallery = db.gallery;

    // Filter by assigned sites
    if (user && user.assignedSites) {
      gallery = gallery.filter(g => 
        user.assignedSites.includes(g.projectId)
      );
    }

    if (projectId) {
      gallery = gallery.filter(g => g.projectId === projectId);
    }

    res.json({
      success: true,
      data: gallery
    });
  } catch (error) {
    next(error);
  }
};

// ============ EXPENSES ============

// Add expense
const addExpense = (req, res, next) => {
  try {
    const { projectId, name, amount, voucherNumber, slipImage, remarks } = req.body;

    const expense = {
      id: db.generateId(),
      projectId,
      name,
      amount: parseFloat(amount),
      voucherNumber: voucherNumber || '',
      slipImage: slipImage || null,
      remarks: remarks || '',
      addedBy: req.session.userId,
      addedByName: req.session.name,
      createdAt: new Date()
    };

    db.expenses.push(expense);

    // Update project expenses
    const project = db.projects.find(p => p.id === projectId);
    if (project) {
      project.expenses = (project.expenses || 0) + parseFloat(amount);
    }

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} added expense: ${name} (₹${amount})`,
      type: 'expense',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// Get expenses for assigned sites
const getExpenses = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user || !user.assignedSites) {
      return res.json({
        success: true,
        data: []
      });
    }

    const expenses = db.expenses.filter(e => 
      user.assignedSites.includes(e.projectId)
    );

    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

// ============ TRANSFER ============

// Request transfer
const requestTransfer = (req, res, next) => {
  try {
    const { type, itemId, fromProject, toProject, quantity, remarks } = req.body;

    const transfer = {
      id: db.generateId(),
      type, // 'labour', 'machine', 'stock'
      itemId,
      fromProject,
      toProject,
      quantity: quantity || 1,
      remarks: remarks || '',
      status: 'pending',
      requestedBy: req.session.userId,
      requestedByName: req.session.name,
      createdAt: new Date()
    };

    db.transfers.push(transfer);

    // Send notification to admin
    const notification = {
      id: db.generateId(),
      senderId: req.session.userId,
      senderName: req.session.name,
      recipientRole: 'admin',
      message: `${req.session.name} requested transfer of ${type}`,
      type: 'transfer',
      read: false,
      createdAt: new Date()
    };
    db.notifications.push(notification);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      message: 'Transfer request submitted successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// Get transfers
const getTransfers = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const transfers = db.transfers.filter(t => t.requestedBy === userId);

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// ============ PAYMENT ============

// Pay labour
const payLabour = (req, res, next) => {
  try {
    const { labourId, amount, deduction, paymentMode, remarks } = req.body;

    const labour = db.labours.find(l => l.id === labourId);

    if (!labour) {
      return res.status(404).json({
        success: false,
        error: 'Labour not found'
      });
    }

    const finalAmount = parseFloat(amount) - (parseFloat(deduction) || 0);

    const payment = {
      id: db.generateId(),
      labourId,
      labourName: labour.name,
      amount: parseFloat(amount),
      deduction: parseFloat(deduction) || 0,
      finalAmount,
      paymentMode: paymentMode || 'cash',
      remarks: remarks || '',
      paidBy: req.session.userId,
      paidByName: req.session.name,
      createdAt: new Date()
    };

    db.payments.push(payment);

    // Update labour pending payout
    labour.pendingPayout = Math.max(0, (labour.pendingPayout || 0) - finalAmount);

    // Record in accounts
    const transaction = {
      id: db.generateId(),
      type: 'labour_payment',
      labourId,
      labourName: labour.name,
      amount: finalAmount,
      paymentMode,
      remarks,
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
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// Get payments
const getPayments = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const payments = db.payments.filter(p => p.paidBy === userId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// ============ NOTIFICATIONS ============

// Get my notifications
const getNotifications = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const notifications = db.notifications.filter(n => 
      n.recipientId === userId || n.recipientRole === 'sitemanager'
    );

    res.json({
      success: true,
      data: notifications
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

// ============ PROFILE ============

// Get my profile
const getProfile = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { password, ...userData } = user;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Get vendors (for dropdown)
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

// Get projects (for site manager)
const getProjects = (req, res, next) => {
  try {
    const userId = req.session.userId;
    const user = db.users.find(u => u.id === userId);

    if (!user || !user.assignedSites) {
      return res.json({
        success: true,
        data: []
      });
    }

    const projects = db.projects.filter(p => 
      user.assignedSites.includes(p.id)
    );

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
