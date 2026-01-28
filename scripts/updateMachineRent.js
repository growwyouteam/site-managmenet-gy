require('dotenv').config();
const mongoose = require('mongoose');
const { Machine } = require('../models');
const connectDB = require('../config/database-fallback');

const updateMachines = async () => {
    try {
        console.log('🔧 Updating Machines to Rented...');

        // Define machines to update
        const machinesToUpdate = ['CRANE', 'JCB'];

        for (const name of machinesToUpdate) {
            const machine = await Machine.findOne({ name: new RegExp(name, 'i') });

            if (machine) {
                console.log(`Found machine: ${machine.name} (${machine._id})`);

                machine.ownershipType = 'rented';
                machine.assignedRentalPerDay = 4500;
                machine.rentalType = 'perDay';
                machine.vendorName = 'City Cranes Ltd';
                machine.assignedAsRental = true;

                await machine.save();
                console.log(`✅ Updated ${machine.name} to RENTED`);
            } else {
                console.log(`⚠️ Machine ${name} not found`);
            }
        }

    } catch (error) {
        console.error('❌ Error updating machines:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

connectDB().then(updateMachines);
