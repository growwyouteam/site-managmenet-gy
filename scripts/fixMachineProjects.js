/**
 * Fix Machine Project Assignments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Machine, Project } = require('../models');

async function fixMachineProjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('=== FIXING MACHINE PROJECT ASSIGNMENTS ===\n');

        // Get all projects
        const projects = await Project.find({});
        console.log(`Found ${projects.length} projects:`);
        projects.forEach(p => {
            console.log(`  - ${p.name} (${p.location}) - ID: ${p._id}`);
        });

        // Get all machines
        const machines = await Machine.find({});
        console.log(`\nFound ${machines.length} machines:`);
        machines.forEach(m => {
            const projectName = m.projectId ? 'Assigned' : 'NO PROJECT';
            console.log(`  - ${m.name} → Project: ${projectName}, Status: ${m.status}`);
        });

        // Assign projects to machines without projects
        const machinesWithoutProjects = machines.filter(m => !m.projectId);
        console.log(`\nFixing ${machinesWithoutProjects.length} machines without projects:`);

        for (const machine of machinesWithoutProjects) {
            // Assign to the first project (can be made smarter)
            const assignedProject = projects[0];
            machine.projectId = assignedProject._id;
            await machine.save();
            console.log(`✅ ${machine.name} → Assigned to ${assignedProject.name}`);
        }

        // Verify the fix
        const updatedMachines = await Machine.find({}).populate('projectId');
        console.log('\n=== VERIFICATION ===');
        updatedMachines.forEach(m => {
            const projectName = m.projectId?.name || 'NO PROJECT';
            console.log(`  - ${m.name} → Project: ${projectName}, Status: ${m.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixMachineProjects();
