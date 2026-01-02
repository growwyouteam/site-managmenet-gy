/**
 * Fix Site Manager project assignments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Project, User } = require('../models');

async function fixSiteManagerProjects() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('Connected to database');

        // Get all available projects
        const projects = await Project.find({});
        console.log('\n=== Available Projects ===');
        projects.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}`);
        });

        // Get all Site Managers
        const siteManagers = await User.find({ role: 'sitemanager' });
        console.log(`\n=== Found ${siteManagers.length} Site Manager(s) ===`);

        // Assign all available projects to all Site Managers
        const projectIds = projects.map(p => p._id);

        for (const sm of siteManagers) {
            console.log(`\nFixing assignments for: ${sm.name}`);

            // Assign all projects to Site Manager
            sm.assignedSites = projectIds;
            await sm.save();

            console.log(`✅ Assigned ${projectIds.length} projects to ${sm.name}`);
            console.log(`  Assigned IDs: ${projectIds.join(', ')}`);
        }

        // Verify the fix
        console.log('\n=== Verification ===');
        const testSM = await User.findOne({ role: 'sitemanager', email: 'rajesh@construction.com' });
        console.log(`Site Manager now has ${testSM.assignedSites.length} assigned projects`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixSiteManagerProjects();
