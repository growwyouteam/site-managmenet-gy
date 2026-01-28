require('dotenv').config();
const mongoose = require('mongoose');
const { Machine } = require('../models');
const connectDB = require('../config/database-fallback');

const debugMachines = async () => {
    try {
        console.log('🔍 Inspecting Machines...');

        const machines = await Machine.find({});

        console.log('\n--- Machine List ---');
        machines.forEach(m => {
            console.log(`ID: ${m._id}`);
            console.log(`Name: ${m.name}`);
            console.log(`Ownership: ${m.ownershipType}`);
            console.log(`Status: ${m.status}`);
            console.log(`Project ID: ${m.projectId}`);
            console.log(`Contractor ID: ${m.assignedToContractor}`);
            console.log('-------------------');
        });

    } catch (error) {
        console.error('❌ Error debugging machines:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

connectDB().then(debugMachines);
