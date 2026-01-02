/**
 * Project Model
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['running', 'completed', 'pending', 'active'],
        default: 'running'
    },
    assignedManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    budget: {
        type: Number,
        default: 0
    },
    expenses: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Performance indexes for production
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ assignedManager: 1 });
projectSchema.index({ budget: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

// Compound indexes for common queries
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ assignedManager: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
