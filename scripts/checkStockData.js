/**
 * Check actual stock data format from API
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Stock, Project } = require('../models');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

const checkData = async () => {
    try {
        const projects = await Project.find().limit(1);
        const stocks = await Stock.find().limit(3);

        console.log('📁 PROJECT:');
        if (projects[0]) {
            console.log(`   _id: ${projects[0]._id}`);
            console.log(`   _id type: ${typeof projects[0]._id}`);
            console.log(`   _id.toString(): ${projects[0]._id.toString()}`);
        }

        console.log('\n📦 STOCKS:');
        stocks.forEach((s, i) => {
            console.log(`\n   Stock ${i + 1}:`);
            console.log(`   Material: ${s.materialName}`);
            console.log(`   projectId: ${s.projectId}`);
            console.log(`   projectId type: ${typeof s.projectId}`);
            console.log(`   projectId.toString(): ${s.projectId.toString()}`);

            if (projects[0]) {
                console.log(`   Match with project? ${s.projectId.toString() === projects[0]._id.toString()}`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

connectDB().then(checkData);
