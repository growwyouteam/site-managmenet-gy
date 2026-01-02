/**
 * Admin Controller - MongoDB Version
 * Handles all admin-specific operations with MongoDB
 */

const mongoose = require('mongoose');
const { User, Project, Vendor, Expense, Labour, Contractor, ContractorPayment, Machine, Stock } = require('../models');

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

        // Validate ID
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID'
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID format'
            });
        }

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
        const { name, location, budget, startDate, endDate, description, assignedManager } = req.body;

        const newProject = new Project({
            name,
            location,
            budget: parseFloat(budget) || 0,
            startDate,
            endDate,
            description,
            assignedManager
        });

        await newProject.save();

        // Update site manager's assigned sites if manager is assigned
        if (assignedManager) {
            await User.findByIdAndUpdate(
                assignedManager,
                { $addToSet: { assignedSites: newProject._id } }
            );
        }

        // Auto-assign new project to ALL existing site managers
        console.log('🔧 Auto-assigning new project to all site managers...');
        const allSiteManagers = await User.find({ role: 'sitemanager', active: true });

        if (allSiteManagers.length > 0) {
            // Add new project to all site managers
            await User.updateMany(
                { role: 'sitemanager', active: true },
                { $addToSet: { assignedSites: newProject._id } }
            );

            console.log(`✅ Auto-assigned project "${name}" to ${allSiteManagers.length} site managers`);
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

        // Get the old project to check manager change
        const oldProject = await Project.findById(id);
        if (!oldProject) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

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

        // Handle site manager assignment changes
        const oldManagerId = oldProject.assignedManager?.toString();
        const newManagerId = updates.assignedManager;

        if (oldManagerId !== newManagerId) {
            // Remove project from old manager's assigned sites
            if (oldManagerId) {
                await User.findByIdAndUpdate(
                    oldManagerId,
                    { $pull: { assignedSites: id } }
                );
            }

            // Add project to new manager's assigned sites
            if (newManagerId) {
                await User.findByIdAndUpdate(
                    newManagerId,
                    { $addToSet: { assignedSites: id } }
                );
            }
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

        // If user is a site manager, automatically assign all existing projects
        if (newUser.role === 'sitemanager') {
            console.log('🔧 Auto-assigning all projects to new site manager:', newUser.name);

            // Get all existing projects
            const allProjects = await Project.find({});
            if (allProjects.length > 0) {
                // Assign all project IDs to the new site manager
                newUser.assignedSites = allProjects.map(project => project._id);
                await newUser.save();

                console.log(`✅ Assigned ${allProjects.length} projects to site manager ${newUser.name}`);
            } else {
                console.log('ℹ️ No projects found to assign');
            }
        }

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
            addedBy: req.user.userId
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
        const machines = await Machine.find()
            .populate('projectId', 'name location')
            .sort('-createdAt');
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
    try {
        console.log(' Fetching stocks (ultra-fast)...');
        const startTime = Date.now();

        // Get stocks without any population for maximum speed
        const stocks = await Stock.find()
            .select('materialName unit quantity unitPrice totalPrice remarks createdAt')
            .sort('-createdAt')
            .lean()
            .maxTimeMS(2000); // 2 second timeout

        const duration = Date.now() - startTime;
        console.log(` Ultra-fast stocks fetched in ${duration}ms (${stocks.length} items)`);

        res.json({
            success: true,
            data: stocks
        });
    } catch (error) {
        console.error(' Error fetching stocks:', error.message);

        // Return empty array on any error to prevent frontend issues
        res.json({
            success: true,
            data: [] // Return empty array instead of error
        });
    }
};

const createStock = async (req, res, next) => {
    try {
        const { projectId, vendorId, materialName, unit, quantity, unitPrice, photo, remarks } = req.body;
        const userId = req.user.userId;

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

const updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Recalculate total price if quantity or unitPrice changed
        if (updates.quantity || updates.unitPrice) {
            const stock = await Stock.findById(id);
            const quantity = updates.quantity || stock.quantity;
            const unitPrice = updates.unitPrice || stock.unitPrice;
            updates.totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
        }

        const stock = await Stock.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!stock) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: stock
        });
    } catch (error) {
        next(error);
    }
};

const deleteStock = async (req, res, next) => {
    try {
        const { id } = req.params;

        const stock = await Stock.findByIdAndDelete(id);

        if (!stock) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getTransfers = async (req, res, next) => {
    res.json({ success: true, data: [] });
};

const createTransfer = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const getAccounts = async (req, res, next) => {
    try {
        // Get all expenses
        const expenses = await Expense.find();
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

        // Mock bank transactions and cash transactions for now
        // In a real implementation, these would come from separate collections
        const bankTransactions = [
            { id: 1, date: new Date(), description: 'Initial Capital', amount: 100000, type: 'credit' },
            { id: 2, date: new Date(), description: 'Project Payment', amount: 50000, type: 'credit' }
        ];

        const cashTransactions = [
            { id: 1, date: new Date(), description: 'Office Supplies', amount: 5000, type: 'debit' },
            { id: 2, date: new Date(), description: 'Fuel Expense', amount: 2000, type: 'debit' }
        ];

        const totalBankTransactions = bankTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalCashTransactions = cashTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        res.json({
            success: true,
            data: {
                capital: 100000, // Mock capital
                totalExpenses,
                bankTransactions,
                cashTransactions,
                totalBankTransactions,
                totalCashTransactions
            }
        });
    } catch (error) {
        next(error);
    }
};

const addCapital = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const addTransaction = async (req, res, next) => {
    res.json({ success: true, message: 'Feature coming soon' });
};

const generateReport = async (req, res, next) => {
    try {
        const { type, startDate, endDate } = req.query;

        let data = [];

        switch (type) {
            case 'expenses':
                data = await Expense.find();
                if (startDate || endDate) {
                    const filter = {};
                    if (startDate) filter.$gte = new Date(startDate);
                    if (endDate) filter.$lte = new Date(endDate);
                    data = data.filter(expense => {
                        const expenseDate = new Date(expense.createdAt);
                        if (startDate && expenseDate < new Date(startDate)) return false;
                        if (endDate && expenseDate > new Date(endDate)) return false;
                        return true;
                    });
                }
                break;

            case 'attendance':
                data = await User.find({ role: 'sitemanager' });
                break;

            case 'stock':
                data = await Stock.find();
                break;

            case 'machines':
                data = await Machine.find();
                break;

            case 'contractors':
                data = await Contractor.find();
                break;

            case 'pl':
                // Profit & Loss report
                const expenses = await Expense.find();
                const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                const projects = await Project.find();
                const totalBudget = projects.reduce((sum, proj) => sum + (proj.budget || 0), 0);
                const profit = totalBudget - totalExpenses;

                data = [
                    { type: 'Revenue', amount: totalBudget, description: 'Total Project Budget' },
                    { type: 'Expenses', amount: totalExpenses, description: 'Total Expenses' },
                    { type: 'Profit', amount: profit, description: 'Net Profit/Loss' }
                ];
                break;

            case 'full':
            default:
                // Full report with all data
                const [allExpenses, allProjects, allUsers, allStocks, allMachines, allContractors] = await Promise.all([
                    Expense.find(),
                    Project.find(),
                    User.find(),
                    Stock.find(),
                    Machine.find(),
                    Contractor.find()
                ]);

                data = {
                    summary: {
                        totalProjects: allProjects.length,
                        totalExpenses: allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
                        totalUsers: allUsers.length,
                        totalStocks: allStocks.length,
                        totalMachines: allMachines.length,
                        totalContractors: allContractors.length
                    },
                    expenses: allExpenses,
                    projects: allProjects,
                    users: allUsers,
                    stocks: allStocks,
                    machines: allMachines,
                    contractors: allContractors
                };
                break;
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
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
