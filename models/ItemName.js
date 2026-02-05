const mongoose = require('mongoose');

const itemNameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['big', 'lab', 'consumables', 'equipment']
    }
}, {
    timestamps: true
});

// Prevent duplicate names within the same category
itemNameSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('ItemName', itemNameSchema);
