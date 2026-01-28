require('dotenv').config();
const mongoose = require('mongoose');
const { Machine, Contractor } = require('../models');
const connectDB = require('../config/database-fallback');

const fixJcb = async () => {
    try {
        console.log('🔧 Fixing JCB Data...');

        // Find JCB
        const machine = await Machine.findOne({ name: { $regex: 'JCB', $options: 'i' } });
        if (!machine) {
            console.log('❌ JCB Not Found');
            return;
        }

        // Find a Contractor
        let contractor = await Contractor.findOne({});
        if (!contractor) {
            console.log('⚠️ No contractor found. Creating temporary one.');
            contractor = new Contractor({
                name: 'Reliable Constructions',
                mobile: '9876543210',
                address: 'Mumbai',
                distanceValue: 10,
                expensePerUnit: 100
            });
            await contractor.save();
        }
        console.log('✅ Using Contractor:', contractor.name);

        // Update Machine
        machine.ownershipType = 'own';
        machine.assignedAsRental = true;
        machine.assignedToContractor = contractor._id;
        machine.assignedRentalPerDay = 5000;
        machine.rentalType = 'perDay';

        // Remove vendorName if it was set by my previous script
        machine.vendorName = undefined;

        await machine.save();
        console.log('✅ Updated JCB to Own + Assigned as Rental');

    } catch (error) {
        console.error('❌ Error fixing JCB:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

connectDB().then(fixJcb);
