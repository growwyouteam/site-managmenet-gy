/**
 * IN-MEMORY DATABASE
 * WARNING: All data will be lost on server restart!
 * This is intentional per project requirements.
 * 
 * To migrate to MongoDB later:
 * 1. Replace this file with Mongoose models
 * 2. Use connect-mongo for session storage
 * 3. Update all controllers to use Model.find(), Model.create(), etc.
 */

const bcrypt = require('bcryptjs');

// Generate unique IDs
let idCounter = 1000;
const generateId = () => `ID${idCounter++}`;

// In-memory data store
const db = {
  // Users: Admin and Site Managers
  users: [],
  
  // Projects/Sites
  projects: [],
  
  // Labour (workers)
  labours: [],
  
  // Machines categorized
  machines: {
    big: [],
    lab: [],
    consumable: [],
    equipments: []
  },
  
  // Stock/Materials per site
  stocks: [],
  
  // Vendors
  vendors: [],
  
  // Expenses
  expenses: [],
  
  // Accounts (capital, transactions)
  accounts: {
    capital: 0,
    bankTransactions: [],
    cashTransactions: [],
    expenses: []
  },
  
  // Attendance records
  attendance: [],
  
  // Labour attendance
  labourAttendance: [],
  
  // Daily reports
  dailyReports: [],
  
  // Gallery images
  gallery: [],
  
  // Notifications
  notifications: [],
  
  // Transfers
  transfers: [],
  
  // Payments
  payments: []
};

// Seed initial data
function seedData() {
  // Create admin user (hardcoded as per requirements)
  const adminPassword = bcrypt.hashSync('password123', 10);
  db.users.push({
    id: 'ADMIN001',
    name: 'Admin',
    email: 'admin@construction.com',
    password: adminPassword,
    role: 'admin',
    active: true,
    createdAt: new Date()
  });

  // Create sample site manager
  const smPassword = bcrypt.hashSync('manager123', 10);
  db.users.push({
    id: 'SM001',
    name: 'Rajesh Kumar',
    email: 'rajesh@construction.com',
    password: smPassword,
    role: 'sitemanager',
    phone: '9876543210',
    salary: 50000,
    assignedSites: ['PROJ001'],
    active: true,
    createdAt: new Date()
  });

  // Create sample project
  db.projects.push({
    id: 'PROJ001',
    name: 'Green Valley Apartments',
    location: 'Mumbai, Maharashtra',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    status: 'running',
    assignedManager: 'SM001',
    budget: 50000000,
    expenses: 0,
    description: 'Residential construction project with 120 units',
    createdAt: new Date()
  });

  // Create sample project
  db.projects.push({
    id: 'PROJ002',
    name: 'Tech Park Phase 2',
    location: 'Pune, Maharashtra',
    startDate: '2024-03-01',
    endDate: '2026-02-28',
    status: 'running',
    assignedManager: null,
    budget: 75000000,
    expenses: 0,
    description: 'Commercial IT park construction',
    createdAt: new Date()
  });

  // Seed some machines
  db.machines.big.push({
    id: generateId(),
    name: 'Excavator CAT 320',
    category: 'big',
    quantity: 2,
    assignedSite: 'PROJ001',
    status: 'working',
    remarks: 'Regular maintenance done',
    createdAt: new Date()
  });

  db.machines.lab.push({
    id: generateId(),
    name: 'Concrete Slump Test Kit',
    category: 'lab',
    quantity: 5,
    assignedSite: 'PROJ001',
    status: 'working',
    remarks: 'Calibrated',
    createdAt: new Date()
  });

  db.machines.consumable.push({
    id: generateId(),
    name: 'Cement Bags (50kg)',
    category: 'consumable',
    quantity: 500,
    assignedSite: 'PROJ001',
    unit: 'bags',
    remarks: 'Stock sufficient',
    createdAt: new Date()
  });

  db.machines.equipments.push({
    id: generateId(),
    name: 'Safety Helmets',
    category: 'equipments',
    quantity: 100,
    assignedSite: 'PROJ001',
    status: 'available',
    remarks: 'ISI marked',
    createdAt: new Date()
  });

  // Seed sample vendor
  db.vendors.push({
    id: generateId(),
    name: 'Steel Suppliers Pvt Ltd',
    contact: '9988776655',
    email: 'steel@suppliers.com',
    materialsSupplied: ['Steel Rods', 'TMT Bars', 'Angles'],
    pendingAmount: 150000,
    totalSupplied: 500000,
    createdAt: new Date()
  });

  db.vendors.push({
    id: generateId(),
    name: 'Cement Traders',
    contact: '9876512340',
    email: 'cement@traders.com',
    materialsSupplied: ['Cement', 'Concrete Mix'],
    pendingAmount: 80000,
    totalSupplied: 300000,
    createdAt: new Date()
  });

  // Seed sample stock
  db.stocks.push({
    id: generateId(),
    projectId: 'PROJ001',
    materialName: 'Steel TMT Bars',
    unit: 'kg',
    quantity: 5000,
    remarks: 'Grade Fe500',
    addedBy: 'SM001',
    createdAt: new Date()
  });

  db.stocks.push({
    id: generateId(),
    projectId: 'PROJ001',
    materialName: 'Cement',
    unit: 'bags',
    quantity: 200,
    remarks: 'OPC 53 Grade',
    addedBy: 'SM001',
    createdAt: new Date()
  });

  // Seed sample labour
  db.labours.push({
    id: generateId(),
    name: 'Ramesh Yadav',
    phone: '9123456789',
    dailyWage: 800,
    designation: 'Mason',
    assignedSite: 'PROJ001',
    enrolledBy: 'SM001',
    active: true,
    pendingPayout: 0,
    createdAt: new Date()
  });

  db.labours.push({
    id: generateId(),
    name: 'Suresh Patil',
    phone: '9234567890',
    dailyWage: 600,
    designation: 'Helper',
    assignedSite: 'PROJ001',
    enrolledBy: 'SM001',
    active: true,
    pendingPayout: 0,
    createdAt: new Date()
  });

  console.log('✅ Seed data initialized successfully');
  console.log('📌 Admin Login: admin@construction.com / password123');
  console.log('📌 Site Manager Login: rajesh@construction.com / manager123');
}

// Initialize seed data on startup
seedData();

// Helper function to generate new IDs
db.generateId = generateId;

module.exports = db;
