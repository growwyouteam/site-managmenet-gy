const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    plateNumber: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['big', 'lab', 'consumables', 'equipment']
    },
    quantity: {
        type: mongoose.Schema.Types.Mixed,
        default: 1
    },
    status: {
        type: String,
        enum: ['available', 'in-use', 'maintenance'],
        default: 'available'
    },
    ownershipType: {
        type: String,
        enum: ['own', 'rented'],
        default: 'own'
    },
    vendorName: {
        type: String,
        trim: true
    },
    machineCategory: {
        type: String,
        trim: true
    },
    machinePhoto: {
        type: String,
        trim: true
    },
    perDayExpense: {
        type: Number,
        default: 0
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    assignedAsRental: {
        type: Boolean,
        default: false
    },
    assignedRentalPerDay: {
        type: Number,
        default: 0
    },
    assignedToContractor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Machine', machineSchema);
