/**
 * MongoDB Database Connection with Fallback
 * Tries MongoDB Atlas first, falls back to local MongoDB
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Try MongoDB Atlas first
        if (process.env.MONGODB_URI) {
            console.log('🔄 Trying to connect to MongoDB Atlas...');
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000, // 5 second timeout
                maxPoolSize: 10
            });

            console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
            console.log(`📊 Database: ${conn.connection.name}`);
            return;
        }

        // Fallback to local MongoDB
        console.log('🔄 Falling back to local MongoDB...');
        const localUri = 'mongodb://localhost:27017/construction_site';
        const conn = await mongoose.connect(localUri);

        console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);

        // If Atlas fails, try local MongoDB
        if (process.env.MONGODB_URI && !error.message.includes('localhost')) {
            console.log('🔄 Atlas failed, trying local MongoDB...');
            try {
                const localUri = 'mongodb://localhost:27017/construction_site';
                const conn = await mongoose.connect(localUri);

                console.log(`✅ Local MongoDB Connected: ${conn.connection.host}`);
                console.log(`📊 Database: ${conn.connection.name}`);
                return;
            } catch (localError) {
                console.error('❌ Local MongoDB also failed:', localError.message);
            }
        }

        console.log('\n🔧 Solutions to try:');
        console.log('1. Check your internet connection');
        console.log('2. Update your MongoDB Atlas URI in .env file');
        console.log('3. Make sure local MongoDB is running (mongodb://localhost:27017)');
        console.log('4. Check MongoDB Atlas cluster status');
        console.log('5. Verify IP whitelist in MongoDB Atlas settings');

        // Don't exit the process, let the app run without database
        console.log('\n⚠️  Running without database connection...');
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;
