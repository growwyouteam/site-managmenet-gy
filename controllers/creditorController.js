const { Creditor } = require('../models');

// Get all creditors
const getCreditors = async (req, res, next) => {
    try {
        const creditors = await Creditor.find().sort('-createdAt');
        res.json({
            success: true,
            data: creditors
        });
    } catch (error) {
        next(error);
    }
};

// Create new creditor
const createCreditor = async (req, res, next) => {
    try {
        const { name, mobile, address } = req.body;

        const creditor = await Creditor.create({
            name,
            mobile,
            address,
            addedBy: req.user.userId
        });

        res.status(201).json({
            success: true,
            data: creditor
        });
    } catch (error) {
        next(error);
    }
};

// Update creditor
const updateCreditor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, mobile, address } = req.body;

        const creditor = await Creditor.findByIdAndUpdate(
            id,
            { name, mobile, address },
            { new: true }
        );

        if (!creditor) {
            return res.status(404).json({ success: false, error: 'Creditor not found' });
        }

        res.json({
            success: true,
            data: creditor
        });
    } catch (error) {
        next(error);
    }
};

// Delete creditor
const deleteCreditor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const creditor = await Creditor.findByIdAndDelete(id);

        if (!creditor) {
            return res.status(404).json({ success: false, error: 'Creditor not found' });
        }

        res.json({
            success: true,
            message: 'Creditor deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get creditor details with transactions
const getCreditorDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const creditor = await Creditor.findById(id);

        if (!creditor) {
            return res.status(404).json({ success: false, error: 'Creditor not found' });
        }

        // Transactions are embedded in the model for simplicity in this design
        // Alternatively, we could query related collections if we didn't embed them.
        // But our plan is to PUSH transactions to this array when payments are made.

        res.json({
            success: true,
            data: creditor
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCreditors,
    createCreditor,
    updateCreditor,
    deleteCreditor,
    getCreditorDetails
};
