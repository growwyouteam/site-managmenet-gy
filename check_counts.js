
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database-fallback');
const { LabEquipment, ConsumableGoods, Equipment } = require('./models');

const checkCounts = async () => {
    await connectDB();

    try {
        const labCount = await LabEquipment.countDocuments();
        const consCount = await ConsumableGoods.countDocuments();
        const equipCount = await Equipment.countDocuments();

        console.log('--- COUNTS ---');
        console.log(`LabEquipment: ${labCount}`);
        console.log(`ConsumableGoods: ${consCount}`);
        console.log(`Equipment: ${equipCount}`);
        console.log('--------------');

    } catch (err) {
        console.error('Error counting:', err);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

checkCounts();
