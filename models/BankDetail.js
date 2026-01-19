/**
 * Bank Detail Model
 */

const mongoose = require('mongoose');

const bankDetailSchema = new mongoose.Schema({
    holderName: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
    },
    branch: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true
    },
    accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        trim: true,
        unique: true
    },
    ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
        trim: true,
        uppercase: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BankDetail', bankDetailSchema);
