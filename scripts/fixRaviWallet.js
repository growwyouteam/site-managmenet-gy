require('dotenv').config();
const mongoose = require('mongoose');
const { User, Transaction } = require('../models');
const connectDB = require('../config/database-fallback');

const fixWallet = async () => {
    try {
        await connectDB();

        // Find Ravi
        const user = await User.findOne({ name: { $regex: /ravi/i } });

        if (!user) {
            console.log('❌ User "Ravi" not found.');
            return;
        }

        console.log(`👤 Found User: ${user.name} (${user._id})`);
        console.log(`💰 Current Wallet Balance: ₹${user.walletBalance}`);

        // Find ALL wallet_allocation transactions
        const transactions = await Transaction.find({
            category: 'wallet_allocation'
        });

        console.log(`📋 Found TOTAL ${transactions.length} allocation transactions.`);

        let targetTx = null;

        for (const tx of transactions) {
            console.log(`   - [${tx.date.toISOString().split('T')[0]}] ₹${tx.amount}: "${tx.description}" (RelatedId: ${tx.relatedId})`);

            // Heuristic: If amount is 50000 
            if (tx.amount === 50000 && (!tx.relatedId || tx.relatedId.toString() === user._id.toString())) {
                targetTx = tx;
            }
        }

        if (targetTx) {
            console.log(`\n✅ Found candidate transaction: ₹${targetTx.amount} - ${targetTx.description}`);
            if (!targetTx.relatedId) {
                targetTx.relatedId = user._id;
                targetTx.onModel = 'User';
                await targetTx.save();
                console.log(`   - Linked transaction to user.`);
            }

            // Assuming this is the ONLY missing allocation for now for simplicity
            // or we add it to current balance. 
            // Better to set exact balance if we know what it should be, but adding is safer if he had previous balance.
            // But he has 0 now.

            if (user.walletBalance < 50000) {
                user.walletBalance = (user.walletBalance || 0) + 50000;
                await user.save();
                console.log(`   - Updated wallet balance to ₹${user.walletBalance}`);
            } else {
                console.log(`   - Wallet balance is already ₹${user.walletBalance}, skipping update.`);
            }
        } else {
            console.log(`\n❌ Could not automatically identify the 50k transaction.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixWallet();
