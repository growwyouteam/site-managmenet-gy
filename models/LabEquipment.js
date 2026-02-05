const mongoose = require('mongoose');

const labEquipmentSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project is required']
    },
    name: {
        type: String,
        required: [true, 'Equipment name is required'],
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'damaged'],
        default: 'active'
    },
    serialNumber: {
        type: String,
        trim: true
    },
    purchaseDate: {
        type: Date
    },
    remarks: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
labEquipmentSchema.index({ projectId: 1 });
labEquipmentSchema.index({ status: 1 });

module.exports = mongoose.model('LabEquipment', labEquipmentSchema);
