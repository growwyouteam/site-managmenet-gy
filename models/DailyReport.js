/**
 * Daily Report Model
 */

const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project is required']
    },
    reportType: {
        type: String,
        enum: ['Morning Report', 'Evening Report', 'Full Day Report'],
        required: [true, 'Report type is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    photos: [{
        type: String // URLs of photos
    }],
    roadProgress: [{
        description: {
            type: String,
            trim: true
        },
        value: {
            type: Number,
            min: 0,
            required: true
        },
        unit: {
            type: String,
            enum: ['m', 'km'],
            default: 'm'
        }
    }],
    stockUsed: [{
        materialName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true
        },
        stockId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stock'
        }
    }],
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for frequent queries
dailyReportSchema.index({ projectId: 1, createdAt: -1 });
dailyReportSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
