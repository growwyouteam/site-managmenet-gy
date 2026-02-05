/**
 * Notification Model
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'general', 'urgent'],
        default: 'info'
    },
    link: {
        type: String,
        trim: true // Optional link to redirect user (e.g., /admin/transfers)
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId // ID of related entity (Transfer, Stock, etc.)
    },
    relatedModel: {
        type: String // Model name of related entity
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
