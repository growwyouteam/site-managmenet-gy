/**
 * Admin Controller - MongoDB Version
 * Handles all admin-specific operations with MongoDB
 */

const { User, Project, Vendor, Expense, Labour, Contractor, ContractorPayment, Machine } = require('../models');

// ============ DASHBOARD ============

// Get dashboard summary
const getDashboard = async (req, res, next) => {
    try {
        const totalProjects = await Project.countDocuments();
        const runningProjects = await Project.countDocuments({ status: 'running' });
        const completedProjects = await Project.countDocuments({ status: 'completed' });
        const totalSiteManagers = await User.countDocuments({ role: 'sitemanager', active: true });
        const totalLabours = await Labour.countDocuments({ active: true });

        const expensesResult = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expensesResult.length > 0 ? expensesResult[0].total : 0;

        const projects = await Project.find().populate('assignedManager', 'name email');

        res.json({
            success: true,
            data: {
                totalProjects,
                runningProjects,
                completedProjects,
                totalSiteManagers,
                totalLabours,
                totalExpenses,
                projects
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============ PROJECTS ============

// Get all projects
const getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find().populate('assignedManager', 'name email').sort('-createdAt');
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

// Get single project detail
const getProjectDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id).populate('assignedManager', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const expenses = await Expense.find({ projectId: id });
        const labours = await Labour.find({ assignedSite: id });

        res.json({
            success: true,
            data: {
                project,
                expenses,
                labours
            }
        });
    } catch (error) {
        next(error);
    }
};

// Create new project
const createProject = async (req, res, next) => {
    try {
        const { name, location, startDate, endDate, budget, assignedManager, description, status } = req.body;

        const newProject = new Project({
            name,
            location,
            startDate,
            endDate,
            budget: parseFloat(budget) || 0,
            assignedManager: assignedManager || null,
            description: description || '',
            status: status || 'running'
        });

        await newProject.save();

        // Update site manager's assigned sites if manager is assigned
        if (assignedManager) {
            await User.findByIdAndUpdate(
                assignedManager,
                { $addToSet: { assignedSites: newProject._id } }
            );
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
const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const project = await Project.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// Delete project
const deleteProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await Project.findByIdAndDelete(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Delete related data
        await Expense.deleteMany({ projectId: id });
        await Labour.updateMany({ assignedSite: id }, { assignedSite: null });

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ============ USERS ============

// Get all users (site managers)
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: 'sitemanager' })
            .select('-password')
            .sort('-createdAt');

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// Create new user (site manager)
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, phone, salary, dateOfJoining, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone,
            salary: parseFloat(salary) || 0,
            dateOfJoining: dateOfJoining || Date.now(),
            role: role || 'sitemanager',
            active: true
        });

        await newUser.save();

        // Remove password from response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
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

        // If password is being updated, it will be hashed by the pre-save hook
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            user[key] = updates[key];
        });

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse
        });
    } catch (error) {
        next(error);
    }
};

// Delete user
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ============ VENDORS ============

// Get all vendors
const getVendors = async (req, res, next) => {
    try {
        const vendors = await Vendor.find().sort('-createdAt');
        res.json({
            success: true,
            data: vendors
        });
    } catch (error) {
        next(error);
    }
};

// Create new vendor
const createVendor = async (req, res, next) => {
    try {
        const { name, contact, email, address } = req.body;

        const newVendor = new Vendor({
            name,
            contact,
            email: email ? email.toLowerCase() : undefined,
            address
        });

        await newVendor.save();

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
const updateVendor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor updated successfully',
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

// Delete vendor
const deleteVendor = async (req, res, next) => {
    try {
        const { id } = req.params;

        const vendor = await Vendor.findByIdAndDelete(id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Record vendor payment
const recordVendorPayment = async (req, res, next) => {
    try {
        const { vendorId, amount } = req.body;

        const vendor = await Vendor.findById(vendorId);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        vendor.pendingAmount = Math.max(0, vendor.pendingAmount - parseFloat(amount));
        await vendor.save();

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: vendor
        });
    } catch (error) {
        next(error);
    }
};

// ============ EXPENSES ============

// Get all expenses
const getExpenses = async (req, res, next) => {
    try {
        const expenses = await Expense.find()
            .populate('projectId', 'name location')
            .populate('addedBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            data: expenses
        });
    } catch (error) {
        next(error);
    }
};

// Create new expense
const createExpense = async (req, res, next) => {
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

// Delete expense
const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        // Update project expenses
        await Project.findByIdAndUpdate(
            expense.projectId,
            { $inc: { expenses: -expense.amount } }
        );

        await expense.deleteOne();

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// ============ LABOURS ============

// Get all labours
const getLabours = async (req, res, next) => {
    try {
        const labours = await Labour.find()
            .populate('assignedSite', 'name location')
            .populate('enrolledBy', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            data: labours
        });
    } catch (error) {
        next(error);
    }
};

// ============ CONTRACTORS ============

const getContractors = async (req, res, next) => {
    try {
        const contractors = await Contractor.find().sort('-createdAt');
        res.json({
            success: true,
            data: contractors
        });
    } catch (error) {
        next(error);
    }
};

const createContractor = async (req, res, next) => {
    try {
        const contractor = new Contractor(req.body);
        await contractor.save();
        res.status(201).json({
            success: true,
            message: 'Contractor created successfully',
            data: contractor
        });
    } catch (error) {
        next(error);
    }
};

const updateContractor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contractor = await Contractor.findByIdAndUpdate(id, req.body, { new: true });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found'
            });
        }
        res.json({
            success: true,
            message: 'Contractor updated successfully',
            data: contractor
        });
    } catch (error) {
        next(error);
    }
};

const deleteContractor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contractor = await Contractor.findByIdAndDelete(id);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found'
            });
        }
        res.json({
            success: true,
            message: 'Contractor deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getContractorPayments = async (req, res, next) => {
    try {
        const { contractorId } = req.params;
        const payments = await ContractorPayment.find({ contractorId }).sort('-createdAt');
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

const createContractorPayment = async (req, res, next) => {
    try {
        const payment = new ContractorPayment(req.body);
        await payment.save();
        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// Placeholder functions for other features
const getMachines = async (req, res, next) => {
    try {
        const machines = await Machine.find().sort('-createdAt');
        res.json({
            success: true,
            data: machines
        });
    } catch (error) {
        next(error);
    }
};

const createMachine = async (req, res, next) => {
    try {
        const machine = new Machine(req.body);
        await machine.save();
        res.status(201).json({
            success: true,
            message: 'Machine added successfully',
            data: machine
        });
    } catch (error) {
        next(error);
    }
};

const updateMachine = async (req, res, next) => {
    try {
        const { id } = req.params;
        const machine = await Machine.findByIdAndUpdate(id, req.body, { new: true });
        if (!machine) {
            return res.status(404).json({
                success: false,
                error: 'Machine not found'
            });
        }
        res.json({
            success: true,
            message: 'Machine updated successfully',
            data: machine
        });
    } catch (error) {
        next(error);
    }
};

const deleteMachine = async (req, res, next) => {
    try {
        const { id } = req.params;
        const machine = await Machine.findByIdAndDelete(id);
        if (!machine) {
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

const getStocks = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const createStock = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const updateStock = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const deleteStock = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getTransfers = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const createTransfer = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getAccounts = async (req, res, next) => {
    res.json({ success: true, data: { capital: 0, bankTransactions: [], cashTransactions: [] } });
};

const addCapital = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const addTransaction = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const generateReport = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const getAttendance = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const getLabourAttendance = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const getNotifications = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const sendNotification = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const markNotificationRead = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
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
    getContractors,
    createContractor,
    updateContractor,
    deleteContractor,
    getContractorPayments,
    createContractorPayment,
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
