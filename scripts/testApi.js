/**
 * Test API Endpoints with Authentication
 * Tests the vendor and stock endpoints
 */

require('dotenv').config();
const axios = require('axios');

const testApi = async () => {
    try {
        console.log('🔄 Testing API endpoints...');

        // First, login to get token
        console.log('🔑 Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@construction.com',
            password: 'password123'
        });

        if (loginResponse.data.success) {
            const token = loginResponse.data.data.token;
            console.log('✅ Login successful');

            // Test vendors endpoint
            console.log('🏪 Testing vendors endpoint...');
            const vendorsResponse = await axios.get('http://localhost:5000/api/admin/vendors', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`✅ Vendors: ${vendorsResponse.data.data.length} items`);

            // Test stocks endpoint
            console.log('📦 Testing stocks endpoint...');
            const stocksResponse = await axios.get('http://localhost:5000/api/admin/stocks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`✅ Stocks: ${stocksResponse.data.data.length} items`);

            // Test projects endpoint
            console.log('🏗️ Testing projects endpoint...');
            const projectsResponse = await axios.get('http://localhost:5000/api/admin/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`✅ Projects: ${projectsResponse.data.data.length} items`);

            console.log('\n🎉 All API endpoints working correctly!');

            // Show sample data
            console.log('\n📊 Sample Data:');
            console.log('Vendors:');
            vendorsResponse.data.data.forEach((vendor, i) => {
                console.log(`  ${i + 1}. ${vendor.name} (${vendor.email})`);
            });

            console.log('\nStocks:');
            stocksResponse.data.data.slice(0, 3).forEach((stock, i) => {
                console.log(`  ${i + 1}. ${stock.materialName} - ${stock.quantity} ${stock.unit}`);
            });

        } else {
            console.error('❌ Login failed:', loginResponse.data.error);
        }

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
};

if (require.main === module) {
    testApi();
}

module.exports = testApi;
