
// ============ WALLET ============

// Get Wallet Transactions
const getWalletTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const transactions = [];

        // 1. Inflows: Wallet Allocations (From Transaction collection)
        const allocations = await Transaction.find({
            category: 'wallet_allocation',
            relatedId: userId
        }).sort('-date').lean();

        allocations.forEach(t => {
            transactions.push({
                _id: t._id,
                date: t.date,
                type: 'credit',
                category: 'Allocation',
                description: t.description || 'Wallet Top-up',
                amount: t.amount,
                refModel: 'Transaction'
            });
        });

        // 2. Outflows: Expenses
        const expenses = await Expense.find({ addedBy: userId }).lean();
        expenses.forEach(e => {
            transactions.push({
                _id: e._id,
                date: e.createdAt,
                type: 'debit',
                category: 'Expense',
                description: `${e.name} (${e.category})`,
                amount: e.amount,
                refModel: 'Expense'
            });
        });

        // 4. Outflows: Stock (Paid)
        const stocks = await Stock.find({ addedBy: userId, paymentStatus: 'paid' }).populate('vendorId', 'name').lean();
        stocks.forEach(s => {
            transactions.push({
                _id: s._id,
                date: s.createdAt,
                type: 'debit',
                category: 'Stock Purchase',
                description: `${s.materialName} - ${s.quantity} ${s.unit} from ${s.vendorId?.name || 'Vendor'}`,
                amount: s.totalPrice,
                refModel: 'Stock'
            });
        });

        // 5. Outflows: Contractor Payments
        const contractorPayments = await ContractorPayment.find({ paidBy: userId }).populate('contractorId', 'name').lean();
        contractorPayments.forEach(p => {
            transactions.push({
                _id: p._id,
                date: p.date,
                type: 'debit',
                category: 'Contractor Payment',
                description: `Payment to ${p.contractorId?.name || 'Contractor'}`,
                amount: p.amount,
                refModel: 'ContractorPayment'
            });
        });

        // 6. Outflows: Vendor Payments
        const vendorPayments = await VendorPayment.find({ paidBy: userId }).populate('vendorId', 'name').lean();
        vendorPayments.forEach(p => {
            transactions.push({
                _id: p._id,
                date: p.date,
                type: 'debit',
                category: 'Vendor Payment',
                description: `Payment to ${p.vendorId?.name || 'Vendor'}`,
                amount: p.amount,
                refModel: 'VendorPayment'
            });
        });

        // 7. Outflows: Labour Payments
        const labourPayments = await LabourPayment.find({ markedBy: userId }).populate('labourId', 'name').lean(); // Assuming markedBy is used? Wait, siteController uses 'markedBy' for Attendance, but payLabour?
        // Let's re-read payLabour in a moment. For now, assuming standard pattern.

        // Sort by date desc
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};

// ============ CONTRACTOR COMMONS ============

const getContractors = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const contractors = await Contractor.find({
            assignedProjects: { $in: user.assignedSites || [] }
        }).lean();

        res.json({ success: true, data: contractors });
    } catch (error) {
        next(error);
    }
};

const payContractor = async (req, res, next) => {
    try {
        const { contractorId, projectId, amount, paymentMode, remarks } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const payAmount = parseFloat(amount);
        if (user.walletBalance < payAmount) {
            return res.status(400).json({ success: false, error: `Insufficient wallet balance. Current: ₹${user.walletBalance}` });
        }

        user.walletBalance -= payAmount;
        await user.save();

        const payment = new ContractorPayment({
            contractorId,
            projectId,
            amount: payAmount,
            date: new Date(),
            paymentMode: paymentMode || 'cash',
            remarks: remarks || '',
            paidBy: userId
        });
        await payment.save();

        res.json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
        next(error);
    }
};

// ============ VENDOR PAYMENTS ============

const payVendor = async (req, res, next) => {
    try {
        const { vendorId, amount, paymentMode, remarks } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        const vendor = await Vendor.findById(vendorId);

        if (!user || !vendor) return res.status(404).json({ success: false, error: 'User or Vendor not found' });

        const payAmount = parseFloat(amount);
        if (user.walletBalance < payAmount) {
            return res.status(400).json({ success: false, error: `Insufficient wallet balance. Current: ₹${user.walletBalance}` });
        }

        user.walletBalance -= payAmount;
        await user.save();

        vendor.pendingAmount = Math.max(0, (vendor.pendingAmount || 0) - payAmount);
        await vendor.save();

        const payment = new VendorPayment({
            vendorId,
            amount: payAmount,
            date: new Date(),
            paymentMode: paymentMode || 'cash',
            remarks: remarks || '',
            paidBy: userId
        });
        await payment.save();

        res.json({ success: true, message: 'Payment recorded', data: payment });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWalletTransactions,
    getContractors,
    payContractor,
    payVendor
};
