/**
 * Reset passwords for all Site Managers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

async function resetSiteManagerPasswords() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('Connected to database');

        // Reset all Site Manager passwords
        const siteManagers = await User.find({ role: 'sitemanager' });

        console.log('\n=== Resetting Site Manager Passwords ===');

        for (const sm of siteManagers) {
            sm.password = '123456';
            await sm.save();
            console.log(`✅ Password reset for: ${sm.name} (${sm.email})`);
        }

        console.log('\n=== New Login Credentials ===');
        console.log('You can now login with any of these:');
        siteManagers.forEach(sm => {
            console.log(`- Email: ${sm.email}, Password: 123456`);
        });

        // Also test one login
        const testUser = siteManagers[0];
        const isValid = await testUser.comparePassword('123456');
        console.log(`\n✅ Login test successful for ${testUser.email}: ${isValid}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

resetSiteManagerPasswords();
