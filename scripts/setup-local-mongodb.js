/**
 * Setup Local MongoDB for Development
 * This script helps you set up local MongoDB as a fallback
 */

const mongoose = require('mongoose');
const { User, Project, Vendor, Expense, Labour, Contractor, ContractorPayment, Machine, Stock } = require('../models');

const setupLocalDB = async () => {
    try {
        console.log('🔄 Setting up local MongoDB...');

        // Connect to local MongoDB
        await mongoose.connect('mongodb://localhost:27017/construction_site', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to local MongoDB');

        // Create sample data if collections are empty
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('📝 Creating sample data...');

            // Create admin user
            const admin = await User.create({
                name: 'Admin User',
                email: 'admin@site.com',
                password: 'admin123',
                role: 'admin',
                phone: '9876543210',
                dateOfJoining: new Date()
            });

            // Create site manager
            const siteManager = await User.create({
                name: 'Site Manager',
                email: 'manager@site.com',
                password: 'manager123',
                role: 'sitemanager',
                phone: '9876543211',
                dateOfJoining: new Date()
            });

            // Create sample project
            const project = await Project.create({
                name: 'Sample Construction Project',
                location: 'Mumbai, Maharashtra',
                budget: 1000000,
                status: 'running',
                startDate: new Date(),
                assignedManager: siteManager._id
            });

            // Create sample vendor
            const vendor = await Vendor.create({
                name: 'Construction Materials Ltd',
                contact: '9876543212',
                email: 'vendor@materials.com',
                address: 'Mumbai, Maharashtra',
                phone: '9876543212'
            });

            // Create sample stock
            await Stock.create({
                projectId: project._id,
                vendorId: vendor._id,
                materialName: 'Cement',
                unit: 'bags',
                quantity: 100,
                unitPrice: 350,
                totalPrice: 35000,
                remarks: 'Sample stock entry'
            });

            // Create sample expense
            await Expense.create({
                projectId: project._id,
                name: 'Labor Cost',
                amount: 50000,
                voucherNumber: 'EXP001',
                remarks: 'Monthly labor payment'
            });

            console.log('✅ Sample data created successfully');
            console.log('👤 Admin login: admin@site.com / admin123');
            console.log('👤 Manager login: manager@site.com / manager123');
        } else {
            console.log('📊 Database already has data');
        }

        console.log('\n🎉 Local MongoDB setup complete!');
        console.log('🔗 Connection string: mongodb://localhost:27017/construction_site');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 To fix this:');
            console.log('1. Install MongoDB Community Server');
            console.log('2. Start MongoDB service');
            console.log('3. Run this script again');
        }
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    setupLocalDB();
}

module.exports = setupLocalDB;
