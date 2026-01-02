/**
 * Check projects and Site Manager assignments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Project, User } = require('../models');

async function checkProjects() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('Connected to database');

        // Get all projects
        const projects = await Project.find({});
        console.log('\n=== All Projects ===');
        projects.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Location: ${p.location}`);
        });

        // Get Site Manager and their assigned projects
        const siteManager = await User.findOne({ role: 'sitemanager', email: 'rajesh@construction.com' });
        console.log('\n=== Site Manager Info ===');
        console.log(`Name: ${siteManager.name}`);
        console.log(`Assigned Sites: ${siteManager.assignedSites}`);

        // Check if assigned projects exist
        console.log('\n=== Assigned Projects Check ===');
        if (siteManager.assignedSites && siteManager.assignedSites.length > 0) {
            for (const assignedId of siteManager.assignedSites) {
                const project = await Project.findById(assignedId);
                console.log(`Assigned ID: ${assignedId} - Exists: ${!!project}`);
                if (project) {
                    console.log(`  Project Name: ${project.name}`);
                } else {
                    console.log(`  ❌ Project not found!`);
                }
            }
        } else {
            console.log('❌ No assigned projects found for Site Manager');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkProjects();
