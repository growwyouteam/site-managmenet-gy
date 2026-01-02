/**
 * Fix Admin Project Access
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Project } = require('../models');

async function fixAdminAccess() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('=== FIXING ADMIN ACCESS ===\n');

        // Get all projects
        const projects = await Project.find({});
        const projectIds = projects.map(p => p._id);

        console.log(`Found ${projects.length} projects:`);
        projects.forEach(p => {
            console.log(`  - ${p.name} (${p.location})`);
        });

        // Update Admin user
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            admin.assignedSites = projectIds;
            await admin.save();
            console.log(`\n✅ Admin (${admin.name}) now has access to all ${projectIds.length} projects`);
        } else {
            console.log('❌ Admin user not found');
        }

        // Verify the fix
        const updatedAdmin = await User.findOne({ role: 'admin' });
        console.log(`\nVerification: Admin has ${updatedAdmin.assignedSites?.length || 0} assigned projects`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixAdminAccess();
