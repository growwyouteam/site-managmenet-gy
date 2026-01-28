require('dotenv').config();
const mongoose = require('mongoose');
const { User, Project } = require('../models');
const connectDB = require('../config/database-fallback');

const fixRajesh = async () => {
    try {
        console.log('🔧 Starting Rajesh Site Fix...');

        // Find Rajesh
        const rajesh = await User.findOne({ email: 'rajesh@construction.com' });
        if (!rajesh) {
            console.log('❌ Rajesh user not found! Please run seed script first if possible.');
            return;
        }
        console.log('✅ Found Rajesh:', rajesh._id);

        // Find Project
        let project = await Project.findOne({ name: 'Green Valley Apartments' });
        if (!project) {
            console.log('⚠️ Project "Green Valley Apartments" not found. Creating it...');
            project = new Project({
                name: 'Green Valley Apartments',
                location: 'Mumbai, Maharashtra',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-12-31'),
                status: 'running',
                assignedManager: rajesh._id,
                budget: 50000000,
                description: 'Residential construction project with 120 units'
            });
            await project.save();
            console.log('✅ Created new project:', project._id);
        } else {
            console.log('✅ Found Project:', project._id);
        }

        // Assign Project to Rajesh
        if (!rajesh.assignedSites.includes(project._id)) {
            rajesh.assignedSites.push(project._id);
            await rajesh.save();
            console.log('🎉 Successfully assigned project to Rajesh!');
        } else {
            console.log('ℹ️ Rajesh is already assigned to this project.');
        }

    } catch (error) {
        console.error('❌ Error fixing Rajesh:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB Connection Closed');
        process.exit(0);
    }
};

connectDB().then(fixRajesh);
