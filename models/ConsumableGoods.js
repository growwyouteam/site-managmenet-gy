const mongoose = require('mongoose');

const consumableGoodsSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project is required']
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    minStockLevel: {
        type: Number,
        default: 0,
        min: 0
    },
    expiryDate: {
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
consumableGoodsSchema.index({ projectId: 1 });
consumableGoodsSchema.index({ quantity: 1 });

module.exports = mongoose.model('ConsumableGoods', consumableGoodsSchema);
