/**
 * Optimize Stocks Collection
 * Creates indexes and optimizes the stocks collection for better performance
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Stock } = require('../models');

const optimizeStocks = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create indexes for better performance
        console.log('📝 Creating indexes...');

        // Index for projectId population
        await Stock.collection.createIndex({ projectId: 1 });
        console.log('✅ Created projectId index');

        // Index for vendorId population
        await Stock.collection.createIndex({ vendorId: 1 });
        console.log('✅ Created vendorId index');

        // Compound index for sorting
        await Stock.collection.createIndex({ createdAt: -1 });
        console.log('✅ Created createdAt index');

        // Test the optimized query
        console.log('🧪 Testing optimized stocks query...');
        const startTime = Date.now();

        const stocks = await Stock.find()
            .populate('projectId', 'name location')
            .populate('vendorId', 'name contact')
            .sort('-createdAt')
            .lean()
            .maxTimeMS(10000);

        const duration = Date.now() - startTime;
        console.log(`⚡ Optimized query completed in ${duration}ms (${stocks.length} items)`);

        // Check if we have any problematic stocks
        console.log('🔍 Checking for problematic stock entries...');
        const problematicStocks = await Stock.find({
            $or: [
                { projectId: { $exists: false } },
                { vendorId: { $exists: false } },
                { projectId: null },
                { vendorId: null }
            ]
        }).lean();

        if (problematicStocks.length > 0) {
            console.log(`⚠️ Found ${problematicStocks.length} problematic stock entries`);
            console.log('🔧 Fixing problematic entries...');

            // Fix problematic entries
            await Stock.updateMany(
                {
                    $or: [
                        { projectId: { $exists: false } },
                        { vendorId: { $exists: false } },
                        { projectId: null },
                        { vendorId: null }
                    ]
                },
                {
                    $set: {
                        projectId: null,
                        vendorId: null
                    }
                }
            );
            console.log('✅ Fixed problematic entries');
        } else {
            console.log('✅ No problematic entries found');
        }

        console.log('\n🎉 Stocks optimization completed!');
        console.log('📊 Summary:');
        console.log(`   Total stocks: ${stocks.length}`);
        console.log(`   Query time: ${duration}ms`);
        console.log(`   Indexes created: 3`);

    } catch (error) {
        console.error('❌ Optimization failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

if (require.main === module) {
    optimizeStocks();
}

module.exports = optimizeStocks;
