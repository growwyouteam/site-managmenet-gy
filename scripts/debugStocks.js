/**
 * Debug script to check stock and project IDs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Stock, Project } = require('../models');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected\n');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const debugStocks = async () => {
    try {
        // Get all projects
        const projects = await Project.find();
        console.log(`📁 Found ${projects.length} projects:`);
        projects.forEach(p => {
            console.log(`   - ${p.name} (ID: ${p._id})`);
        });

        // Get all stocks
        const stocks = await Stock.find();
        console.log(`\n📦 Found ${stocks.length} stocks:`);
        stocks.forEach(s => {
            console.log(`   - ${s.materialName} (Project ID: ${s.projectId})`);
        });

        // Check if IDs match
        if (projects.length > 0 && stocks.length > 0) {
            const projectId = projects[0]._id.toString();
            const stockProjectId = stocks[0].projectId.toString();
            console.log(`\n🔍 ID Comparison:`);
            console.log(`   Project ID: ${projectId}`);
            console.log(`   Stock Project ID: ${stockProjectId}`);
            console.log(`   Match: ${projectId === stockProjectId ? '✅ YES' : '❌ NO'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

connectDB().then(debugStocks);
