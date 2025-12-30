/**
 * Site Manager Controller - MongoDB Version
 * Handles all site manager-specific operations with MongoDB
 */

const { User, Project, Vendor, Expense, Labour, Stock } = require('../models');

// ============ DASHBOARD ============

// Get site manager dashboard
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get assigned projects
        const assignedProjects = await Project.find({
            _id: { $in: user.assignedSites || [] }
        });

        // Get labour count
        const labourCount = await Labour.countDocuments({
            assignedSite: { $in: user.assignedSites || [] }
        });

        // Get today's attendance (placeholder - implement when attendance model is ready)
        const todayAttendance = [];

        // Get notifications (placeholder)
        const notifications = [];

        res.json({
            success: true,
            data: {
                user,
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

const markAttendance = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getMyAttendance = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ LABOUR ============

// Get all labours for assigned sites
const getLabours = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const labours = await Labour.find({
            assignedSite: { $in: user.assignedSites || [] }
        }).populate('assignedSite', 'name location');

        res.json({
            success: true,
            data: labours
        });
    } catch (error) {
        next(error);
    }
};

// Enroll new labour
const enrollLabour = async (req, res, next) => {
    try {
        const { name, phone, dailyWage, designation, assignedSite } = req.body;

        const newLabour = new Labour({
            name,
            phone,
            dailyWage: parseFloat(dailyWage),
            designation,
            assignedSite,
            enrolledBy: req.session.userId,
            active: true
        });

        await newLabour.save();

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
const updateLabour = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const labour = await Labour.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!labour) {
            return res.status(404).json({
                success: false,
                error: 'Labour not found'
            });
        }

        res.json({
            success: true,
            message: 'Labour updated successfully',
            data: labour
        });
    } catch (error) {
        next(error);
    }
};

// ============ LABOUR ATTENDANCE ============

const markLabourAttendance = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getLabourAttendance = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ STOCK IN ============

const addStockIn = async (req, res, next) => {
    try {
        const { projectId, vendorId, materialName, unit, quantity, unitPrice, photo, remarks } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify project is assigned to this site manager
        if (!user.assignedSites || !user.assignedSites.includes(projectId)) {
            return res.status(403).json({
                success: false,
                error: 'You are not assigned to this project'
            });
        }

        const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);

        const newStock = new Stock({
            projectId,
            vendorId,
            materialName,
            unit,
            quantity: parseFloat(quantity),
            unitPrice: parseFloat(unitPrice),
            totalPrice,
            photo,
            remarks,
            addedBy: userId
        });

        await newStock.save();

        res.status(201).json({
            success: true,
            message: 'Stock added successfully',
            data: newStock
        });
    } catch (error) {
        next(error);
    }
};

const getStocks = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const stocks = await Stock.find({
            projectId: { $in: user.assignedSites || [] }
        })
            .populate('projectId', 'name location')
            .populate('vendorId', 'name contact')
            .sort('-createdAt');

        res.json({
            success: true,
            data: stocks
        });
    } catch (error) {
        next(error);
    }
};

// ============ DAILY REPORT ============

const submitDailyReport = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getDailyReports = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ GALLERY ============

const uploadGalleryImages = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getGalleryImages = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ EXPENSES ============

// Get expenses for assigned projects
const getExpenses = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const expenses = await Expense.find({
            projectId: { $in: user.assignedSites || [] }
        })
            .populate('projectId', 'name location')
            .sort('-createdAt');

        res.json({
            success: true,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
};

// Add expense
const addExpense = async (req, res, next) => {
    try {
        const { projectId, name, amount, voucherNumber, category, remarks } = req.body;

        const newExpense = new Expense({
            projectId,
            name,
            amount: parseFloat(amount),
            voucherNumber,
            category: category || 'material',
            remarks,
            addedBy: req.session.userId
        });

        await newExpense.save();

        // Update project expenses
        await Project.findByIdAndUpdate(
            projectId,
            { $inc: { expenses: parseFloat(amount) } }
        );

        res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            data: newExpense
        });
    } catch (error) {
        next(error);
    }
};

// ============ TRANSFER ============

const requestTransfer = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getTransfers = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ PAYMENT ============

const payLabour = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getPayments = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

// ============ NOTIFICATIONS ============

const getNotifications = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const markNotificationRead = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

// ============ PROFILE ============

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-password');

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

// ============ VENDORS ============

const getVendors = async (req, res, next) => {
    try {
        const vendors = await Vendor.find().select('name contact');
        res.json({
            success: true,
            data: vendors
        });
    } catch (error) {
        next(error);
    }
};

// ============ PROJECTS ============

const getProjects = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const projects = await Project.find({
            _id: { $in: user.assignedSites || [] }
        });

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
