/**
 * Fix All Machine Project Assignments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Machine, Project } = require('../models');

async function fixAllMachineProjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('=== FIXING ALL MACHINE PROJECT ASSIGNMENTS ===\n');

        // Get all projects
        const projects = await Project.find({});
        console.log(`Available projects:`);
        projects.forEach(p => {
            console.log(`  - ${p.name} (${p.location})`);
        });

        // Get all machines
        const machines = await Machine.find({});
        console.log(`\nProcessing ${machines.length} machines:`);

        // Assign each machine to a project (round-robin assignment)
        for (let i = 0; i < machines.length; i++) {
            const machine = machines[i];
            const projectIndex = i % projects.length;
            const assignedProject = projects[projectIndex];

            machine.projectId = assignedProject._id;
            await machine.save();

            console.log(`✅ ${machine.name} → Assigned to ${assignedProject.name}`);
        }

        // Verify the fix
        const updatedMachines = await Machine.find({}).populate('projectId');
        console.log('\n=== FINAL VERIFICATION ===');
        updatedMachines.forEach(m => {
            const projectName = m.projectId?.name || 'NO PROJECT';
            console.log(`  - ${m.name} → Project: ${projectName}, Status: ${m.status}`);
        });

        console.log('\n✅ All machines now have project assignments!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixAllMachineProjects();
