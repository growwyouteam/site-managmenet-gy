const mongoose = require('mongoose');

const creditorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Creditor name is required'],
        trim: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    currentBalance: {
        type: Number,
        default: 0 // Amount we owe them
    },
    transactions: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['credit', 'debit'], // credit = we bought on credit (balance increases), debit = we paid them (balance decreases)
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: String,
        refId: mongoose.Schema.Types.ObjectId, // Reference to Expense/Payment ID
        refModel: String
    }],
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Creditor', creditorSchema);
