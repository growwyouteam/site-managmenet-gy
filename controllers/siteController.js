/**
 * Site Manager Controller - MongoDB Version
 * Handles all site manager-specific operations with MongoDB
 */

const { User, Project, Vendor, Expense, Labour, LabourAttendance, LabourPayment, Stock, StockOut, Machine, Transfer, DailyReport, LabEquipment, ConsumableGoods, Equipment, Attendance } = require('../models');

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

        console.log('Site Manager Dashboard - User:', user.name, 'assignedSites:', user.assignedSites);

        // Get assigned projects
        const assignedProjects = await Project.find({
            _id: { $in: user.assignedSites || [] }
        });

        console.log('Found assigned projects:', assignedProjects.length);

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
        console.error('Error in site manager dashboard:', error);
        next(error);
    }
};

// ============ ATTENDANCE ============

const markAttendance = async (req, res, next) => {
    try {
        const { projectId, date, photo, remarks } = req.body;
        const userId = req.user.userId;

        // Check if attendance already marked for this date
        const existingAttendance = await Attendance.findOne({
            userId,
            date
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                error: 'Attendance already marked for this date'
            });
        }

        const attendance = new Attendance({
            userId,
            projectId,
            date,
            photo,  // Photo is now optional
            remarks
        });

        await attendance.save();

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const attendance = await Attendance.find({ userId })
            .populate('projectId', 'name location')
            .sort('-date')
            .limit(100);

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
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

        const { projectId } = req.query;
        const query = projectId
            ? { assignedSite: projectId }
            : { assignedSite: { $in: user.assignedSites || [] } };

        const labours = await Labour.find(query).populate('assignedSite', 'name location');

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
            enrolledBy: req.user.userId,
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
    try {
        const { labourId, labourName, projectId, date, status, remarks } = req.body;
        const userId = req.user.userId;

        // Check if attendance already marked for this labour on this date
        const existingAttendance = await LabourAttendance.findOne({
            labourId,
            date: new Date(date)
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                error: 'Attendance already marked for this labour today'
            });
        }

        // Get labour details to update pendingPayout
        const labour = await Labour.findById(labourId);
        if (!labour) {
            return res.status(404).json({
                success: false,
                error: 'Labour not found'
            });
        }

        // Create attendance record
        const attendance = new LabourAttendance({
            labourId,
            labourName,
            projectId,
            date: new Date(date),
            status,
            remarks,
            markedBy: userId
        });

        await attendance.save();

        // Update pendingPayout based on status
        let payoutAmount = 0;
        if (status === 'present') {
            payoutAmount = labour.dailyWage;
        } else if (status === 'half') {
            payoutAmount = labour.dailyWage / 2;
        }
        // For 'absent', payoutAmount remains 0

        if (payoutAmount > 0) {
            await Labour.findByIdAndUpdate(
                labourId,
                { $inc: { pendingPayout: payoutAmount } }
            );
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

const getLabourAttendance = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get attendance for assigned projects
        const attendance = await LabourAttendance.find({
            projectId: { $in: user.assignedSites || [] }
        })
            .populate('labourId', 'name phone dailyWage designation')
            .populate('projectId', 'name location')
            .sort('-date')
            .limit(100);

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// ============ STOCK IN ============

const addStockIn = async (req, res, next) => {
    try {
        const { projectId, vendorId, materialName, unit, quantity, unitPrice, remarks } = req.body;
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

        // Upload photo to Cloudinary if file exists
        let photoUrl = null;
        if (req.file) {
            const { uploadToCloudinary } = require('../config/cloudinary');
            photoUrl = await uploadToCloudinary(req.file.buffer, 'stock');
        }

        const newStock = new Stock({
            projectId,
            vendorId,
            materialName,
            unit,
            quantity: parseFloat(quantity),
            unitPrice: parseFloat(unitPrice),
            totalPrice,
            photo: photoUrl,
            remarks,
            addedBy: userId
        });

        await newStock.save();

        // Update vendor's totalSupplied and pendingAmount
        if (vendorId) {
            await Vendor.findByIdAndUpdate(
                vendorId,
                {
                    $inc: {
                        totalSupplied: totalPrice,
                        pendingAmount: totalPrice
                    }
                }
            );
        }

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
        const { startDate, endDate, vendorId } = req.query;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('🔍 Site Manager Stocks - User:', user.name, 'assignedSites:', user.assignedSites);

        // Check if user has assigned sites
        if (!user.assignedSites || user.assignedSites.length === 0) {
            console.log('ℹ️ No assigned sites for site manager, returning empty stocks');
            return res.json({
                success: true,
                data: []
            });
        }

        // Build query
        const query = {
            projectId: { $in: user.assignedSites }
        };

        if (vendorId && vendorId !== 'all') {
            query.vendorId = vendorId;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Increase limit if filtering, otherwise default to 50 (restored from 10)
        // If filtering is applied, we usually want to see all results
        const limit = (startDate || endDate || (vendorId && vendorId !== 'all')) ? 1000 : 50;

        const stocks = await Stock.find(query)
            .populate('projectId', 'name location')
            .populate('vendorId', 'name contact')
            .populate('addedBy', 'name') // Populate the adder's name
            .sort('-createdAt')
            .limit(limit)
            .lean();

        console.log(`✅ Found ${stocks.length} stocks for site manager ${user.name}`);

        res.json({
            success: true,
            data: stocks
        });
    } catch (error) {
        console.error('❌ Error in getStocks:', error);
        next(error);
    }
};

// Record Stock Out (Usage) with automatic deduction
const recordStockOut = async (req, res, next) => {
    try {
        const { projectId, materialName, quantity, unit, usedFor, remarks } = req.body;
        const userId = req.user.userId;

        const quantityVal = parseFloat(quantity);
        if (quantityVal <= 0) {
            return res.status(400).json({ success: false, error: 'Quantity must be greater than 0' });
        }

        // Find available stock for this material (FIFO)
        const stock = await Stock.findOne({
            projectId,
            materialName,
            quantity: { $gte: quantityVal }
        }).sort({ createdAt: 1 });

        if (!stock) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock for ${materialName}. Required: ${quantityVal} ${unit}`
            });
        }

        // Deduct quantity from stock
        stock.quantity -= quantityVal;
        await stock.save();

        // Create StockOut record
        const stockOut = await StockOut.create({
            projectId,
            materialName,
            quantity: quantityVal,
            unit,
            usedFor,
            remarks,
            recordedBy: userId
        });

        console.log(`✅ Stock Out recorded: ${materialName} - ${quantityVal} ${unit}`);

        res.status(201).json({
            success: true,
            message: 'Stock usage recorded successfully',
            data: stockOut
        });
    } catch (error) {
        console.error('❌ Error recording stock out:', error);
        next(error);
    }
};

// Get Stock Out records
const getStockOuts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const stockOuts = await StockOut.find({
            projectId: { $in: user.assignedSites }
        })
            .populate('projectId', 'name')
            .populate('recordedBy', 'name')
            .sort('-createdAt')
            .limit(50)
            .lean();

        // Format for frontend table
        const formattedData = stockOuts.map(s => ({
            _id: s._id,
            date: s.date || s.createdAt,
            type: 'OUT',
            material: s.materialName,
            quantity: s.quantity,
            unit: s.unit,
            project: typeof s.projectId === 'object' ? s.projectId.name : s.projectId,
            projectId: typeof s.projectId === 'object' ? s.projectId._id : s.projectId, // Added for filtering
            usedFor: s.usedFor,
            remarks: s.remarks || '-'
        }));

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('❌ Error fetching stock outs:', error);
        next(error);
    }
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

        // Upload receipt to Cloudinary if file exists
        let receiptUrl = null;
        if (req.file) {
            const { uploadToCloudinary } = require('../config/cloudinary');
            receiptUrl = await uploadToCloudinary(req.file.buffer, 'expenses');
        }

        const newExpense = new Expense({
            projectId,
            name,
            amount: parseFloat(amount),
            voucherNumber,
            category: category || 'material',
            remarks,
            receipt: receiptUrl,
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

// ============ TRANSFER ============

const requestTransfer = async (req, res, next) => {
    try {
        const { type, itemId, fromProject, toProject, quantity, remarks } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!type || !fromProject || !toProject) {
            return res.status(400).json({ success: false, error: 'Please provide all required fields' });
        }

        const transferData = {
            type,
            fromProject,
            toProject,
            quantity: parseFloat(quantity) || 1,
            remarks,
            requestedBy: userId,
            status: 'approved' // Auto-approve for Site Managers
        };

        // Handle specific types and ID assignment
        if (type === 'labour') {
            if (!itemId) return res.status(400).json({ success: false, error: 'Labour is required' });
            transferData.labourId = itemId;
        } else if (type === 'machine' || type === 'lab-equipment' || type === 'equipment') {
            if (!itemId) return res.status(400).json({ success: false, error: 'Item is required' });
            transferData.machineId = itemId;
        } else if (type === 'stock' || type === 'consumable-goods') {
            if (!itemId) return res.status(400).json({ success: false, error: 'Item is required' });
            transferData.materialName = itemId;

            if (type === 'consumable-goods') {
                // Try to resolve name from ID if possible, though itemId usually is name for stock?
                // But for consumable-goods frontend might pass ID.
                // Let's try to find if it's an ID
                if (itemId.match(/^[0-9a-fA-F]{24}$/)) {
                    const item = await ConsumableGoods.findById(itemId);
                    if (item) transferData.materialName = item.name;
                }
            }
        }

        const transfer = new Transfer(transferData);
        await transfer.save();

        // EXECUTE TRANSFER (Move Items Immediately)
        if (type === 'labour') {
            await Labour.findByIdAndUpdate(itemId, { assignedSite: toProject });
        } else if (type === 'machine') {
            await Machine.findByIdAndUpdate(itemId, {
                projectId: toProject,
                status: 'available',
                assignedToContractor: null
            });
        } else if (type === 'lab-equipment') {
            await LabEquipment.findByIdAndUpdate(itemId, {
                projectId: toProject,
                status: 'active'
            });
        } else if (type === 'equipment') {
            await Equipment.findByIdAndUpdate(itemId, {
                projectId: toProject,
                status: 'active'
            });
        } else if (type === 'stock') {
            // Logic to move stock
            // itemId is materialName (as per frontend usage usually)

            const sourceStock = await Stock.findOne({ projectId: fromProject, materialName: itemId });

            if (sourceStock) {
                sourceStock.quantity = Math.max(0, sourceStock.quantity - (parseFloat(quantity) || 0));
                await sourceStock.save();

                // Add to destination
                const stockQuantity = parseFloat(quantity) || 0;
                let destStock = await Stock.findOne({
                    projectId: toProject,
                    materialName: sourceStock.materialName,
                    vendorId: sourceStock.vendorId,
                    unitPrice: sourceStock.unitPrice
                });

                if (destStock) {
                    destStock.quantity += stockQuantity;
                    destStock.totalPrice = destStock.quantity * destStock.unitPrice;
                    await destStock.save();
                } else {
                    await Stock.create({
                        projectId: toProject,
                        vendorId: sourceStock.vendorId,
                        materialName: sourceStock.materialName,
                        unit: sourceStock.unit,
                        quantity: stockQuantity,
                        unitPrice: sourceStock.unitPrice,
                        totalPrice: stockQuantity * sourceStock.unitPrice,
                        addedBy: userId,
                        photo: sourceStock.photo,
                        remarks: `Transferred from ${fromProject}`
                    });
                }
            }
        } else if (type === 'consumable-goods') {
            // itemId might be ID or Name. Using id as priority.
            let sourceItem = null;
            if (itemId.match(/^[0-9a-fA-F]{24}$/)) {
                sourceItem = await ConsumableGoods.findById(itemId);
            } else {
                sourceItem = await ConsumableGoods.findOne({ projectId: fromProject, name: itemId });
            }

            if (sourceItem) {
                sourceItem.quantity = Math.max(0, sourceItem.quantity - (parseFloat(quantity) || 0));
                await sourceItem.save();

                const qty = parseFloat(quantity) || 0;
                let destItem = await ConsumableGoods.findOne({
                    projectId: toProject,
                    name: sourceItem.name
                });

                if (destItem) {
                    destItem.quantity += qty;
                    await destItem.save();
                } else {
                    await ConsumableGoods.create({
                        projectId: toProject,
                        name: sourceItem.name,
                        category: sourceItem.category,
                        quantity: qty,
                        unit: sourceItem.unit,
                        minStockLevel: sourceItem.minStockLevel,
                        expiryDate: sourceItem.expiryDate,
                        remarks: `Transferred from ${fromProject}`
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            message: 'Transfer executed successfully (Auto-Approved)',
            data: transfer
        });
    } catch (error) {
        next(error);
    }
};

const getTransfers = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Get transfers where From or To project is assigned to this user
        // Or requested by this user? Usually Site Managers see requests for their sites.
        const transfers = await Transfer.find({
            $or: [
                { fromProject: { $in: user.assignedSites } },
                { toProject: { $in: user.assignedSites } },
                { requestedBy: userId }
            ]
        })
            .populate('fromProject', 'name')
            .populate('toProject', 'name')
            .populate('labourId', 'name designation')
            .populate('machineId', 'name')
            .populate('requestedBy', 'name')
            .sort('-createdAt');

        res.json({
            success: true,
            data: transfers
        });
    } catch (error) {
        next(error);
    }
};

const getMaterials = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Aggregate stocks by project and material to get available quantities
        const materials = await Stock.aggregate([
            {
                $match: {
                    projectId: { $in: user.assignedSites },
                    quantity: { $gt: 0 } // Only consider positive quantities
                }
            },
            {
                $group: {
                    _id: { material: "$materialName", project: "$projectId" },
                    totalQuantity: { $sum: "$quantity" },
                    unit: { $first: "$unit" }
                }
            },
            {
                $project: {
                    _id: 0,
                    materialName: "$_id.material",
                    projectId: "$_id.project",
                    quantity: "$totalQuantity",
                    unit: 1
                }
            },
            { $sort: { materialName: 1 } }
        ]);

        res.json({
            success: true,
            data: materials // Returns [{ materialName, projectId, quantity, unit }, ...]
        });
    } catch (error) {
        next(error);
    }
};

// ============ PAYMENT ============

const payLabour = async (req, res, next) => {
    try {
        const { labourId, amount, deduction, advance, paymentMode, remarks } = req.body;
        const userId = req.user.userId;

        const amountVal = parseFloat(amount) || 0;
        const deductionVal = parseFloat(deduction) || 0;
        const advanceVal = parseFloat(advance) || 0;
        const finalAmount = amountVal - deductionVal - advanceVal;

        // At least one of amount or advance must be provided
        if (amountVal <= 0 && advanceVal <= 0) {
            return res.status(400).json({ success: false, error: 'Amount or Advance must be greater than 0' });
        }

        const labour = await Labour.findById(labourId);
        if (!labour) {
            return res.status(404).json({ success: false, error: 'Labour not found' });
        }

        const payment = new LabourPayment({
            labourId,
            userId,
            amount: amountVal,
            deduction: deductionVal,
            advance: advanceVal,
            finalAmount,
            paymentMode,
            remarks
        });

        await payment.save();

        // Update labour pending payout (subtract the gross amount being cleared)
        await Labour.findByIdAndUpdate(labourId, {
            $inc: { pendingPayout: -amountVal }
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

const getPayments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get payments made by this site manager using populate (simpler and more reliable)
        const payments = await LabourPayment.find({ userId: user._id })
            .populate('labourId', 'name designation')
            .sort('-createdAt')
            .limit(50)
            .lean();

        // Map to include labourName for frontend
        const formattedPayments = payments.map(p => ({
            _id: p._id,
            amount: p.amount,
            deduction: p.deduction,
            advance: p.advance || 0,
            finalAmount: p.finalAmount,
            paymentMode: p.paymentMode,
            createdAt: p.createdAt,
            labourId: p.labourId?._id || p.labourId, // Added for frontend identification/filtering
            labourName: p.labourId?.name || 'Unknown Labour'
        }));

        console.log(`✅ Found ${formattedPayments.length} payments for user ${user.name}`);

        res.json({
            success: true,
            data: formattedPayments
        });
    } catch (error) {
        console.error('❌ Error in getPayments:', error);
        next(error);
    }
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

        console.log('🔍 Site Manager Projects - User:', user.name, 'assignedSites:', user.assignedSites);

        // Check if user has assigned sites
        if (!user.assignedSites || user.assignedSites.length === 0) {
            console.log('ℹ️ No assigned sites for site manager, returning empty projects');
            return res.json({
                success: true,
                data: []
            });
        }

        const projects = await Project.find({
            _id: { $in: user.assignedSites }
        });

        console.log(`✅ Found ${projects.length} projects for site manager ${user.name}`);

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('❌ Error in getProjects:', error);
        next(error);
    }
};

// ============ STOCK OUT & MOVEMENTS ============

const addStockOut = async (req, res, next) => {
    try {
        const { projectId, materialName, quantity, unit, usedFor, date, remarks } = req.body;
        const userId = req.user.userId;

        const stockOut = new StockOut({
            projectId,
            materialName,
            quantity: parseFloat(quantity),
            unit,
            usedFor,
            date: date || Date.now(),
            remarks,
            recordedBy: userId
        });

        await stockOut.save();

        res.status(201).json({
            success: true,
            message: 'Stock usage recorded',
            data: stockOut
        });
    } catch (error) {
        next(error);
    }
};

const getStockMovements = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, search, page = 1, limit = 20 } = req.query;
        const user = await User.findById(userId);

        if (!user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0 } });
        }

        // Build Queries
        let inQuery = { projectId: { $in: user.assignedSites } };
        let outQuery = { projectId: { $in: user.assignedSites } };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            inQuery.createdAt = { $gte: start, $lte: end };
            outQuery.date = { $gte: start, $lte: end };
        } else if (startDate) {
            inQuery.createdAt = { $gte: new Date(startDate) };
            outQuery.date = { $gte: new Date(startDate) };
        }

        // Fetch Data
        const [stocksIn, stocksOut] = await Promise.all([
            Stock.find(inQuery).select('-photo').populate('projectId', 'name').populate('vendorId', 'name').sort('-createdAt').lean(),
            StockOut.find(outQuery).populate('projectId', 'name').sort('-date').lean()
        ]);

        // Combine and Tag
        const combined = [
            ...stocksIn.map(s => ({
                _id: s._id,
                date: s.createdAt,
                material: s.materialName,
                vendor: s.vendorId?.name || '-',
                type: 'IN',
                quantity: s.quantity,
                unit: s.unit,
                project: s.projectId?.name || 'Unknown',
                remarks: s.remarks,
                usedFor: '-'
            })),
            ...stocksOut.map(s => ({
                _id: s._id,
                date: s.date,
                material: s.materialName,
                vendor: '-',
                type: 'OUT',
                quantity: s.quantity,
                unit: s.unit,
                project: s.projectId?.name || 'Unknown',
                remarks: s.remarks,
                usedFor: s.usedFor
            }))
        ];

        // Filter (Search)
        let filtered = combined;
        if (search) {
            const regex = new RegExp(search, 'i');
            filtered = combined.filter(item =>
                regex.test(item.material) ||
                regex.test(item.vendor) ||
                regex.test(item.remarks) ||
                regex.test(item.usedFor)
            );
        }

        // Sort (Newest First)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Pagination
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedData = filtered.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: paginatedData,
            pagination: {
                total,
                page: Number(page),
                pages: totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============ MACHINES ============

const getMachines = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (!user.assignedSites || user.assignedSites.length === 0) {
            console.log('⚠️ No assigned sites for user:', user.name);
            return res.json({ success: true, data: [] });
        }

        console.log(`🔍 Fetching machines for sites:`, user.assignedSites);

        const { projectId } = req.query;
        const query = projectId
            ? { projectId: projectId }
            : { projectId: { $in: user.assignedSites } };

        console.log(`🔍 Fetching machines for query:`, query);

        const machines = await Machine.find(query).populate('projectId', 'name');

        console.log(`✅ Found ${machines.length} machines for user ${user.name}`);

        res.json({
            success: true,
            data: machines
        });
    } catch (error) {
        console.error('❌ Error in getMachines:', error);
        next(error);
    }
};

// ============ DAILY REPORT ============

const submitDailyReport = async (req, res, next) => {
    try {
        const { projectId, reportType, description, photos, roadDistance, stockUsed } = req.body;
        const userId = req.user.userId;

        // Validate stock availability and deduct quantities
        if (stockUsed && stockUsed.length > 0) {
            for (const item of stockUsed) {
                // Find available stock for this material
                const stock = await Stock.findOne({
                    projectId,
                    materialName: item.materialName,
                    quantity: { $gte: item.quantity }
                }).sort({ createdAt: 1 }); // FIFO - First In First Out

                if (!stock) {
                    return res.status(400).json({
                        success: false,
                        error: `Insufficient stock for ${item.materialName}. Required: ${item.quantity} ${item.unit}`
                    });
                }

                // Deduct quantity from stock
                stock.quantity -= item.quantity;
                await stock.save();

                // Create StockOut record for tracking
                await StockOut.create({
                    projectId,
                    materialName: item.materialName,
                    quantity: item.quantity,
                    unit: item.unit,
                    usedFor: `Daily Report - ${reportType}`, // Changed from 'purpose' to 'usedFor'
                    remarks: `Road construction: ${roadDistance?.value || 0} ${roadDistance?.unit || 'm'}`,
                    recordedBy: userId // Changed from 'issuedBy' to 'recordedBy'
                });

                // Store stockId in the item for reference
                item.stockId = stock._id;
            }
        }

        // Create Daily Report
        const dailyReport = new DailyReport({
            projectId,
            reportType,
            description,
            photos: photos || [],
            roadDistance: roadDistance || { value: 0, unit: 'm' },
            stockUsed: stockUsed || [],
            submittedBy: userId
        });

        await dailyReport.save();

        console.log(`✅ Daily Report submitted for project ${projectId} by user ${userId}`);

        res.status(201).json({
            success: true,
            message: 'Daily report submitted successfully',
            data: dailyReport
        });
    } catch (error) {
        console.error('❌ Error submitting daily report:', error);
        next(error);
    }
};

const getDailyReports = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const reports = await DailyReport.find({
            projectId: { $in: user.assignedSites }
        })
            .populate('projectId', 'name location')
            .populate('submittedBy', 'name')
            .sort('-createdAt')
            .limit(50);

        console.log(`✅ Found ${reports.length} daily reports for user ${user.name}`);

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('❌ Error fetching daily reports:', error);
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
    recordStockOut,
    getStockOuts,
    addStockOut, // Added this export
    getStockMovements,
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
    getProjects,
    getMachines,
    getMaterials
};

// ============ LAB EQUIPMENT ============

const getLabEquipments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { projectId } = req.query;
        const query = {
            category: 'lab',
            projectId: projectId ? projectId : { $in: user.assignedSites }
        };

        const labEquipments = await Machine.find(query).populate('projectId', 'name').lean();

        res.json({ success: true, data: labEquipments });
    } catch (error) {
        console.error('❌ Error fetching lab equipments:', error);
        next(error);
    }
};

const getConsumableGoods = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { projectId } = req.query;
        const query = {
            category: 'consumables',
            projectId: projectId ? projectId : { $in: user.assignedSites }
        };

        const consumableGoods = await Machine.find(query).populate('projectId', 'name').lean();

        res.json({ success: true, data: consumableGoods });
    } catch (error) {
        console.error('❌ Error fetching consumable goods:', error);
        next(error);
    }
};

const getEquipments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user || !user.assignedSites || user.assignedSites.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const { projectId } = req.query;
        const query = {
            category: 'equipment',
            projectId: projectId ? projectId : { $in: user.assignedSites }
        };

        const equipments = await Machine.find(query).populate('projectId', 'name').lean();

        res.json({ success: true, data: equipments });
    } catch (error) {
        console.error('❌ Error fetching equipments:', error);
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
    recordStockOut,
    getStockOuts,
    addStockOut,
    getStockMovements,
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
    getProjects,
    getMachines,
    getMaterials,
    getLabEquipments,
    getConsumableGoods,
    getEquipments
};
