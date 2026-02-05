const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['labour', 'machine', 'stock', 'lab-equipment', 'consumable-goods', 'equipment']
    },
    fromProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    toProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    // For Labour Transfer
    labourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour'
    },
    // For Machine Transfer
    machineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine'
    },
    // For Stock Transfer
    materialName: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    remarks: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transfer', transferSchema);
