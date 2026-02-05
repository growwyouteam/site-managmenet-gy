/**
 * Labour Attendance Model
 */

const mongoose = require('mongoose');

const labourAttendanceSchema = new mongoose.Schema({
    labourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        required: true
    },
    labourName: {
        type: String,
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'half', 'absent'],
        required: true
    },
    remarks: {
        type: String,
        default: ''
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate attendance for same labour on same day
labourAttendanceSchema.index({ labourId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LabourAttendance', labourAttendanceSchema);
