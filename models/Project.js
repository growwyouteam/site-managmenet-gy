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

module.exports = mongoose.model('Project', projectSchema);
