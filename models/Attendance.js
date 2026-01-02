/**
 * Attendance Model
 * Tracks attendance for site managers and labours
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    labourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Labour',
        index: true
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    photo: {
        type: String,
        required: true
    },
    remarks: {
        type: String,
        default: ''
    },
    time: {
        type: Date,
        default: Date.now,
        index: true
    },
    location: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['present', 'late', 'absent'],
        default: 'present'
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },
    workHours: {
        type: Number,
        default: 0
    },
    overtime: {
        type: Number,
        default: 0
    },
    attendanceType: {
        type: String,
        enum: ['site_manager', 'labour'],
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound indexes for better performance
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ projectId: 1, date: -1 });
attendanceSchema.index({ labourId: 1, date: -1 });
attendanceSchema.index({ attendanceType: 1, date: -1 });

// Prevent duplicate attendance for same user, project, and date
attendanceSchema.index({ userId: 1, projectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ labourId: 1, projectId: 1, date: 1 }, { unique: true, sparse: true });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function () {
    return new Date(this.date).toLocaleDateString();
});

// Pre-save middleware for work hours calculation
attendanceSchema.pre('save', function (next) {
    if (this.checkInTime && this.checkOutTime) {
        const diffMs = this.checkOutTime - this.checkInTime;
        this.workHours = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // Round to 2 decimal places

        // Calculate overtime (more than 8 hours)
        if (this.workHours > 8) {
            this.overtime = this.workHours - 8;
        }
    }
    next();
});

// Static methods for common queries
attendanceSchema.statics.findByUserAndDateRange = function (userId, startDate, endDate) {
    return this.find({
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
    }).populate('projectId', 'name location');
};

attendanceSchema.statics.findByProjectAndDate = function (projectId, date) {
    return this.find({
        projectId: projectId,
        date: date
    }).populate('userId', 'name email')
        .populate('labourId', 'name phone');
};

attendanceSchema.statics.getAttendanceStats = function (projectId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                projectId: new mongoose.Types.ObjectId(projectId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalWorkHours: { $sum: '$workHours' },
                totalOvertime: { $sum: '$overtime' }
            }
        }
    ]);
};

module.exports = mongoose.model('Attendance', attendanceSchema);
