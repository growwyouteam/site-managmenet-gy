/**
 * Fix MongoDB Connection Issues
 * This script helps fix MongoDB connection problems
 */

const fs = require('fs');
const path = require('path');

const fixMongoDBConnection = () => {
    console.log('🔧 Fixing MongoDB connection issues...\n');

    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env file not found');

        if (fs.existsSync(envExamplePath)) {
            console.log('📝 Creating .env from .env.example...');
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ .env file created');
        } else {
            console.log('❌ .env.example file not found');
            return;
        }
    }

    // Read current .env content
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if MONGODB_URI is set
    if (!envContent.includes('MONGODB_URI=')) {
        console.log('📝 Adding MONGODB_URI to .env...');
        envContent += '\n# MongoDB Connection\nMONGODB_URI=mongodb://localhost:27017/construction_site\n';
        fs.writeFileSync(envPath, envContent);
        console.log('✅ MONGODB_URI added to .env');
    }

    console.log('\n🎯 Solutions to try:');
    console.log('1. Use local MongoDB (recommended for development):');
    console.log('   MONGODB_URI=mongodb://localhost:27017/construction_site');
    console.log('\n2. Update your MongoDB Atlas URI:');
    console.log('   - Get new URI from MongoDB Atlas dashboard');
    console.log('   - Make sure IP whitelist includes 0.0.0.0/0');
    console.log('   - Check cluster status');
    console.log('\n3. Install and start local MongoDB:');
    console.log('   - Download MongoDB Community Server');
    console.log('   - Start MongoDB service');
    console.log('   - Run: node scripts/setup-local-mongodb.js');

    console.log('\n🚀 Quick fix commands:');
    console.log('npm run setup-local-db  # Setup local MongoDB with sample data');
    console.log('npm run dev             # Start server with fallback connection');
};

if (require.main === module) {
    fixMongoDBConnection();
}

module.exports = fixMongoDBConnection;
