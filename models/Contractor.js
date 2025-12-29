const mongoose = require('mongoose');

const contractorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    distanceValue: {
        type: Number,
        required: true
    },
    distanceUnit: {
        type: String,
        enum: ['km', 'm'],
        default: 'km'
    },
    expensePerUnit: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contractor', contractorSchema);
