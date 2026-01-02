/**
 * Test Site Manager Login
 */

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function testSiteManagerLogin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('Connected to database');

        // Test each Site Manager
        const siteManagers = await User.find({ role: 'sitemanager' });

        console.log('\n=== Testing Site Manager Login ===');

        for (const sm of siteManagers) {
            console.log(`\nTesting: ${sm.name} (${sm.email})`);

            // Test password comparison
            const testPassword = '123456'; // Try common password

            // Check if password exists and is valid
            if (sm.password) {
                const isValid = await sm.comparePassword(testPassword);
                console.log(`Password '123456' valid: ${isValid}`);

                // Generate JWT token if password is valid
                if (isValid) {
                    const token = jwt.sign(
                        {
                            userId: sm._id.toString(),
                            role: sm.role,
                            name: sm.name,
                            email: sm.email
                        },
                        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
                        { expiresIn: '7d' }
                    );
                    console.log(`✅ JWT Token generated: ${token.substring(0, 50)}...`);
                }
            } else {
                console.log('❌ No password set');
            }
        }

        console.log('\n=== Available Login Credentials ===');
        console.log('Try these credentials:');
        siteManagers.forEach(sm => {
            console.log(`- Email: ${sm.email}, Password: 123456 (try this first)`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testSiteManagerLogin();
