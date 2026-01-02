/**
 * System Diagnosis - Check project visibility across all modules
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Project, User, Vendor, Stock, Machine, Contractor, Expense } = require('../models');

async function diagnoseSystem() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction-site');
        console.log('=== SYSTEM DIAGNOSIS ===\n');

        // 1. Check Projects
        const projects = await Project.find({});
        console.log(`📁 PROJECTS: ${projects.length} found`);
        projects.forEach(p => {
            console.log(`  - ${p.name} (${p.location}) - ID: ${p._id}`);
        });

        // 2. Check Users and their assignments
        const users = await User.find({});
        console.log(`\n👥 USERS: ${users.length} found`);
        users.forEach(u => {
            console.log(`  - ${u.name} (${u.role}) - Assigned: ${u.assignedSites?.length || 0} projects`);
        });

        // 3. Check Stock data
        const stocks = await Stock.find({}).populate('projectId vendorId');
        console.log(`\n📦 STOCK: ${stocks.length} records found`);
        stocks.forEach(s => {
            const projectName = s.projectId?.name || 'NO PROJECT';
            const vendorName = s.vendorId?.name || 'NO VENDOR';
            console.log(`  - ${s.materialName} → Project: ${projectName}, Vendor: ${vendorName}`);
        });

        // 4. Check Vendors
        const vendors = await Vendor.find({});
        console.log(`\n🏪 VENDORS: ${vendors.length} found`);
        vendors.forEach(v => {
            console.log(`  - ${v.name} (${v.contact})`);
        });

        // 5. Check Machines
        const machines = await Machine.find({}).populate('projectId');
        console.log(`\n🔧 MACHINES: ${machines.length} found`);
        machines.forEach(m => {
            const projectName = m.projectId?.name || 'NO PROJECT';
            console.log(`  - ${m.name} → Project: ${projectName}, Status: ${m.status || 'UNKNOWN'}`);
        });

        // 6. Check Contractors
        const contractors = await Contractor.find({});
        console.log(`\n👷 CONTRACTORS: ${contractors.length} found`);
        contractors.forEach(c => {
            console.log(`  - ${c.name} - Total Paid: ₹${c.totalPaid || 0}, Pending: ₹${c.pendingPayment || 0}`);
        });

        // 7. Check Expenses
        const expenses = await Expense.find({}).populate('projectId');
        console.log(`\n💰 EXPENSES: ${expenses.length} found`);
        expenses.forEach(e => {
            const projectName = e.projectId?.name || 'NO PROJECT';
            console.log(`  - ${e.name} (₹${e.amount}) → Project: ${projectName}`);
        });

        console.log('\n=== DIAGNOSIS COMPLETE ===');
        console.log('\n🚨 ISSUES IDENTIFIED:');

        if (projects.length === 0) console.log('  ❌ No projects in database');
        if (stocks.some(s => !s.projectId)) console.log('  ❌ Stock records without project assignment');
        if (machines.some(m => !m.projectId)) console.log('  ❌ Machines without project assignment');
        if (expenses.some(e => !e.projectId)) console.log('  ❌ Expenses without project assignment');

    } catch (error) {
        console.error('❌ Diagnosis Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnoseSystem();
