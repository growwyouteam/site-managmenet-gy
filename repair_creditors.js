
const mongoose = require('mongoose');
const { Creditor } = require('./models');
require('dotenv').config();

const repairCreditors = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const creditors = await Creditor.find();
        for (const creditor of creditors) {
            console.log(`Processing ${creditor.name}...`);
            let updated = false;
            let runningBalance = 0; // Or should we trust the transaction history to rebuild it? 
            // Better to rebuild from scratch if we trust the history list now. 
            // But wait, the history list has WRONG types. We need to fix types first.

            creditor.transactions.forEach(t => {
                // Fix Source (Used for paying...) -> Should be Credit (Liability Up)
                if (t.description && t.description.includes('used for paying')) {
                    if (t.type !== 'credit') {
                        t.type = 'credit';
                        updated = true;
                        console.log(`  Fixed Source Transaction ${t._id}: Debit -> Credit`);
                    }
                }
                // Fix Target (Payment recd from...) -> Should be Debit (Liability Down)
                if (t.description && t.description.includes('Payment recd from')) {
                    if (t.type !== 'debit') {
                        t.type = 'debit';
                        updated = true;
                        console.log(`  Fixed Target Transaction ${t._id}: Credit -> Debit`);
                    }
                }
            });

            // Recalculate Balance
            // Credit = + (Borrowing/Liability Up)
            // Debit = - (Paying/Liability Down)
            let calculatedBalance = 0;
            creditor.transactions.forEach(t => {
                if (t.type === 'credit') calculatedBalance += t.amount;
                else if (t.type === 'debit') calculatedBalance -= t.amount;
            });

            if (creditor.currentBalance !== calculatedBalance) {
                console.log(`  Balance Mismatch! DB: ${creditor.currentBalance}, Calc: ${calculatedBalance}. Updating...`);
                creditor.currentBalance = calculatedBalance;
                updated = true;
            }

            if (updated) {
                await creditor.save();
                console.log(`  Saved ${creditor.name}`);
            } else {
                console.log(`  No changes for ${creditor.name}`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

repairCreditors();
