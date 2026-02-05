/**
 * Add Sample Data for Testing
 * Creates sample vendors and stocks for testing the frontend
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Vendor, Stock, Project } = require('../models');

const addSampleData = async () => {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_site');
        console.log('✅ Connected to MongoDB');

        // Check if data already exists
        const vendorCount = await Vendor.countDocuments();
        const stockCount = await Stock.countDocuments();

        if (vendorCount > 0 && stockCount > 0) {
            console.log('📊 Sample data already exists:');
            console.log(`   Vendors: ${vendorCount}`);
            console.log(`   Stocks: ${stockCount}`);
            return;
        }

        // Create sample projects if needed
        let projects = await Project.find();
        if (projects.length === 0) {
            console.log('📝 Creating sample projects...');
            projects = await Project.create([
                {
                    name: 'Mumbai Commercial Complex',
                    location: 'Mumbai, Maharashtra',
                    budget: 5000000,
                    status: 'running',
                    startDate: new Date()
                },
                {
                    name: 'Pune Residential Tower',
                    location: 'Pune, Maharashtra',
                    budget: 3000000,
                    status: 'running',
                    startDate: new Date()
                }
            ]);
            console.log(`✅ Created ${projects.length} projects`);
        }

        // Create sample vendors
        console.log('📝 Creating sample vendors...');
        const vendors = await Vendor.create([
            {
                name: 'Construction Materials Ltd',
                contact: '9876543210',
                email: 'materials@construction.com',
                address: 'Mumbai, Maharashtra',
                phone: '9876543210'
            },
            {
                name: 'Steel Suppliers India',
                contact: '9876543211',
                email: 'steel@suppliers.com',
                address: 'Pune, Maharashtra',
                phone: '9876543211'
            },
            {
                name: 'Cement & Concrete Co',
                contact: '9876543212',
                email: 'cement@concrete.com',
                address: 'Navi Mumbai, Maharashtra',
                phone: '9876543212'
            }
        ]);
        console.log(`✅ Created ${vendors.length} vendors`);

        // Create sample stocks
        console.log('📝 Creating sample stocks...');
        const stocks = await Stock.create([
            {
                projectId: projects[0]._id,
                vendorId: vendors[0]._id,
                materialName: 'Cement',
                unit: 'bags',
                quantity: 500,
                unitPrice: 350,
                totalPrice: 175000,
                remarks: 'High quality cement for foundation'
            },
            {
                projectId: projects[0]._id,
                vendorId: vendors[1]._id,
                materialName: 'Steel Rods',
                unit: 'ton',
                quantity: 25,
                unitPrice: 45000,
                totalPrice: 1125000,
                remarks: 'TMT steel bars for structural work'
            },
            {
                projectId: projects[1]._id,
                vendorId: vendors[2]._id,
                materialName: 'Concrete Mix',
                unit: 'cubic meter',
                quantity: 100,
                unitPrice: 5500,
                totalPrice: 550000,
                remarks: 'Ready mix concrete for slabs'
            },
            {
                projectId: projects[1]._id,
                vendorId: vendors[0]._id,
                materialName: 'Bricks',
                unit: 'thousand',
                quantity: 50,
                unitPrice: 6500,
                totalPrice: 325000,
                remarks: 'Clay bricks for walls'
            },
            {
                projectId: projects[0]._id,
                vendorId: vendors[2]._id,
                materialName: 'Sand',
                unit: 'cubic meter',
                quantity: 200,
                unitPrice: 1200,
                totalPrice: 240000,
                remarks: 'River sand for construction'
            }
        ]);
        console.log(`✅ Created ${stocks.length} stock entries`);

        console.log('\n🎉 Sample data created successfully!');
        console.log('📊 Summary:');
        console.log(`   Projects: ${projects.length}`);
        console.log(`   Vendors: ${vendors.length}`);
        console.log(`   Stocks: ${stocks.length}`);

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

if (require.main === module) {
    addSampleData();
}

module.exports = addSampleData;
