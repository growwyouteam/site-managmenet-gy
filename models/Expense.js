/**
 * Expense Model
 */

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    name: {
        type: String,
        required: [true, 'Expense name is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    voucherNumber: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['material', 'labour', 'equipment', 'other', 'machine_rental', 'maintenance'],
        default: 'material'
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'online', 'upi', 'bank_transfer', 'bank', 'check', 'credit', 'other'], // standardized
        default: 'cash'
    },
    bankId: { // Associated with bank/online/check
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankDetail'
    },
    creditorId: { // Associated with credit
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creditor'
    },
    remarks: {
        type: String,
        trim: true
    },
    receipt: {
        type: String,
        trim: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for frequent queries
expenseSchema.index({ projectId: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
