const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin123@cluster0.7l87f.mongodb.net/construction-erp?retryWrites=true&w=majority&appName=Cluster0";

const Project = require('../models/Project');
const Machine = require('../models/Machine');

const debug = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const project = await Project.findOne({ name: /Green Valley/i });
        if (!project) {
            console.log('Project "Green Valley" not found');
            const allP = await Project.find().limit(5);
            console.log('Available projects:', allP.map(p => p.name));
            return;
        }

        console.log(`Project Found: ${project.name} (${project._id})`);

        const machines = await Machine.find({ projectId: project._id });
        console.log(`Found ${machines.length} machines for this project.`);

        machines.forEach(m => {
            console.log(`- Name: ${m.name}, Category: '${m.category}', Status: '${m.status}', ID: ${m._id}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
