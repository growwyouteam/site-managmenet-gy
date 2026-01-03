/**
 * Seed Stock Data
 * Adds sample stock items to existing projects
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Stock, Project, Vendor } = require('../models');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const seedStocks = async () => {
    try {
        console.log('🌱 Starting stock data seed...\n');

        // Get first project
        const project = await Project.findOne();
        if (!project) {
            console.log('❌ No project found. Please run npm run seed first.');
            return;
        }

        // Get first vendor
        const vendor = await Vendor.findOne();

        // Create sample stocks
        const stocks = [
            {
                projectId: project._id,
                vendorId: vendor?._id,
                materialName: 'Cement (OPC 53 Grade)',
                unit: 'bags',
                quantity: 500,
                unitPrice: 350,
                totalPrice: 175000,
                remarks: 'High quality cement for foundation'
            },
            {
                projectId: project._id,
                vendorId: vendor?._id,
                materialName: 'Steel TMT Bars (Fe 500)',
                unit: 'kg',
                quantity: 2000,
                unitPrice: 55,
                totalPrice: 110000,
                remarks: '12mm diameter bars'
            },
            {
                projectId: project._id,
                vendorId: vendor?._id,
                materialName: 'Bricks (Red Clay)',
                unit: 'pcs',
                quantity: 10000,
                unitPrice: 8,
                totalPrice: 80000,
                remarks: 'Standard size bricks'
            },
            {
                projectId: project._id,
                vendorId: vendor?._id,
                materialName: 'Sand (River Sand)',
                unit: 'ft',
                quantity: 150,
                unitPrice: 1200,
                totalPrice: 180000,
                remarks: 'Fine quality river sand'
            },
            {
                projectId: project._id,
                vendorId: vendor?._id,
                materialName: 'Aggregate (20mm)',
                unit: 'ft',
                quantity: 100,
                unitPrice: 1500,
                totalPrice: 150000,
                remarks: 'Crushed stone aggregate'
            }
        ];

        // Clear existing stocks (optional)
        await Stock.deleteMany({});
        console.log('🗑️  Cleared existing stock data\n');

        // Insert stocks
        await Stock.insertMany(stocks);
        console.log(`✅ Created ${stocks.length} stock items for project: ${project.name}\n`);

        console.log('📦 Stock Items:');
        stocks.forEach(stock => {
            console.log(`   - ${stock.materialName}: ${stock.quantity} ${stock.unit} = ₹${stock.totalPrice.toLocaleString()}`);
        });

        console.log('\n🎉 Stock data seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding stocks:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

// Run seed
connectDB().then(seedStocks);
