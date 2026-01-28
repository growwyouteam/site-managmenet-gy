/**
 * Seed Database Script
 * Creates initial admin and site manager users
 * Run: node scripts/seedDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Project, Vendor, Labour } = require('../models');

const connectDB = require('../config/database-fallback');

const seedData = async () => {
    try {
        console.log('🌱 Starting database seed...\n');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await User.deleteMany({});
        // await Project.deleteMany({});
        // await Vendor.deleteMany({});
        // await Labour.deleteMany({});
        // console.log('🗑️  Cleared existing data\n');

        // Create Admin User
        const adminExists = await User.findOne({ email: 'admin@construction.com' });
        if (!adminExists) {
            const admin = new User({
                name: 'Admin',
                email: 'admin@construction.com',
                password: 'password123',
                role: 'admin',
                active: true
            });
            await admin.save();
            console.log('✅ Admin user created');
            console.log('   Email: admin@construction.com');
            console.log('   Password: password123\n');
        } else {
            console.log('ℹ️  Admin user already exists\n');
        }

        // Create Site Manager
        const managerExists = await User.findOne({ email: 'rajesh@construction.com' });
        if (!managerExists) {
            const manager = new User({
                name: 'Rajesh Kumar',
                email: 'rajesh@construction.com',
                password: 'manager123',
                role: 'sitemanager',
                phone: '9876543210',
                salary: 50000,
                active: true
            });
            await manager.save();
            console.log('✅ Site Manager created');
            console.log('   Email: rajesh@construction.com');
            console.log('   Password: manager123\n');

            // Create sample project
            const project = new Project({
                name: 'Green Valley Apartments',
                location: 'Mumbai, Maharashtra',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2025-12-31'),
                status: 'running',
                assignedManager: manager._id,
                budget: 50000000,
                description: 'Residential construction project with 120 units'
            });
            await project.save();
            console.log('✅ Sample project created\n');

            // Update manager's assigned sites
            manager.assignedSites.push(project._id);
            await manager.save();

            // Create sample vendor
            const vendor = new Vendor({
                name: 'Steel Suppliers Pvt Ltd',
                contact: '9988776655',
                email: 'steel@suppliers.com',
                materialsSupplied: ['Steel Rods', 'TMT Bars', 'Angles'],
                pendingAmount: 150000,
                totalSupplied: 500000
            });
            await vendor.save();
            console.log('✅ Sample vendor created\n');

            // Create sample labour
            const labour = new Labour({
                name: 'Ramesh Yadav',
                phone: '9123456789',
                dailyWage: 800,
                designation: 'Mason',
                assignedSite: project._id,
                enrolledBy: manager._id,
                active: true
            });
            await labour.save();
            console.log('✅ Sample labour created\n');
        } else {
            console.log('ℹ️  Site Manager already exists\n');
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📝 You can now login with:');
        console.log('   Admin: admin@construction.com / password123');
        console.log('   Site Manager: rajesh@construction.com / manager123\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run seed
connectDB().then(seedData);
