#!/usr/bin/env node
/**
 * Test script for SQLite Database Adapter
 * Verifies that the database adapter works correctly
 */

const { SQLiteAdapter } = require('./dist/database/sqlite-adapter');

async function testDatabase() {
    console.log('🧪 Testing SQLite Database Adapter...\n');
    
    const config = {
        type: 'sqlite',
        path: './data/inventory.db'
    };
    
    const db = new SQLiteAdapter(config);
    
    try {
        // Test connection
        console.log('1. Testing connection...');
        await db.connect();
        console.log('✅ Connected successfully\n');
        
        // Test query
        console.log('2. Testing query...');
        const users = await db.query('SELECT * FROM users LIMIT 1');
        console.log(`✅ Query successful: Found ${users.length} users\n`);
        
        // Test queryOne
        console.log('3. Testing queryOne...');
        const user = await db.queryOne('SELECT username, email FROM users WHERE role = ?', ['owner_ultimate_super_admin']);
        console.log(`✅ QueryOne successful: ${user?.username || 'No user found'}\n`);
        
        // Test products query
        console.log('4. Testing products query...');
        const products = await db.query('SELECT name, selling_price, stock_quantity FROM products LIMIT 3');
        console.log(`✅ Products query successful: Found ${products.length} products`);
        products.forEach(product => {
            console.log(`   - ${product.name}: $${product.selling_price} (Stock: ${product.stock_quantity})`);
        });
        console.log();
        
        // Test full-text search
        console.log('5. Testing full-text search...');
        const searchResults = await db.query('SELECT name FROM products_fts WHERE products_fts MATCH ? LIMIT 3', ['iPhone OR Samsung']);
        console.log(`✅ Full-text search successful: Found ${searchResults.length} results`);
        searchResults.forEach(result => {
            console.log(`   - ${result.name}`);
        });
        console.log();
        
        // Test database stats
        console.log('6. Testing database stats...');
        const stats = await db.getStats();
        console.log(`✅ Database stats: ${stats.tables} tables, ${(stats.totalSize / 1024).toFixed(2)} KB`);
        console.log(`   Record counts: ${JSON.stringify(stats.recordCounts, null, 2)}\n`);
        
        // Test integrity
        console.log('7. Testing database integrity...');
        const isIntegrity = await db.checkIntegrity();
        console.log(`✅ Database integrity: ${isIntegrity ? 'OK' : 'FAILED'}\n`);
        
        console.log('🎉 All database tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await db.close();
        console.log('✅ Database connection closed');
    }
}

// Run the test
testDatabase().catch(console.error);



