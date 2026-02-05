/**
 * Vendor Model
 */

const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
    },
    contact: {
        type: String,
        required: [true, 'Contact is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    },
    materialsSupplied: [{
        type: String
    }],
    pendingAmount: {
        type: Number,
        default: 0
    },
    totalSupplied: {
        type: Number,
        default: 0
    },
    advancePayment: {
        type: Number,
        default: 0
    },
    vendorId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Generate vendorId before saving
vendorSchema.pre('save', function (next) {
    if (!this.vendorId) {
        const prefix = 'VEN';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.vendorId = `${prefix}${timestamp}${random}`;
    }
    next();
});

module.exports = mongoose.model('Vendor', vendorSchema);
