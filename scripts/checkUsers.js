/**
 * Check existing users and create Site Manager if needed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

async function checkAndCreateSiteManager() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('Connected to database');

        // Check existing users
        const users = await User.find({});
        console.log('\n=== Existing Users ===');
        users.forEach(user => {
            console.log(`Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Active: ${user.active}`);
        });

        // Check if any Site Manager exists
        const siteManagers = users.filter(u => u.role === 'sitemanager');
        console.log(`\nFound ${siteManagers.length} Site Manager(s)`);

        // Create a default Site Manager if none exists
        if (siteManagers.length === 0) {
            console.log('\nCreating default Site Manager...');

            const defaultSiteManager = new User({
                name: 'Site Manager',
                email: 'sitemanager@test.com',
                password: '123456',
                role: 'sitemanager',
                phone: '9876543210',
                active: true
            });

            await defaultSiteManager.save();
            console.log('✅ Default Site Manager created successfully!');
            console.log('Email: sitemanager@test.com');
            console.log('Password: 123456');
        }

        // Create/update Admin user
        const adminUser = users.find(u => u.role === 'admin');
        if (!adminUser) {
            console.log('\nCreating default Admin user...');

            const defaultAdmin = new User({
                name: 'Admin',
                email: 'admin@test.com',
                password: '123456',
                role: 'admin',
                phone: '9876543211',
                active: true
            });

            await defaultAdmin.save();
            console.log('✅ Default Admin created successfully!');
            console.log('Email: admin@test.com');
            console.log('Password: 123456');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAndCreateSiteManager();
