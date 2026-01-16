const mongoose = require('mongoose');

const contractorPaymentSchema = new mongoose.Schema({
    contractorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contractor',
        required: true
    },
    contractorName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'online', 'check'],
        default: 'cash'
    },
    remark: {
        type: String,
        default: ''
    },
    machineRent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ContractorPayment', contractorPaymentSchema);
