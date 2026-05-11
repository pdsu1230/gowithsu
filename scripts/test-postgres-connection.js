const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Set IPv6 first for Supabase free tier
dns.setDefaultResultOrder('ipv6first');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const cleanKey = key.trim();
      const cleanValue = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[cleanKey] = cleanValue;
    }
  });
}

async function testConnection() {
  console.log('Testing PostgreSQL connection...\n');
  
  const connectionString = process.env.DATABASE_URL;
  const pgSSL = process.env.PG_SSL === 'true';
  
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not set in environment');
    process.exit(1);
  }
  
  console.log('📌 Configuration:');
  console.log(`   DATABASE_URL: ${connectionString.substring(0, 50)}...`);
  console.log(`   PG_SSL: ${pgSSL}`);
  console.log();
  
  const pool = new Pool({
    connectionString,
    ssl: pgSSL ? { rejectUnauthorized: false } : false,
    family: 6  // Prefer IPv6 for Supabase free tier
  });
  
  try {
    console.log('⏳ Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log(`\n📅 Server time: ${result.rows[0].now}`);
    
    // Check if tables exist
    const tablesResult = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    
    console.log(`\n📊 Existing tables (${tablesResult.rows.length}):`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => console.log(`   - ${row.tablename}`));
    } else {
      console.log('   (No tables yet - need to run migration)');
    }
    
    // Count records if tables exist
    const tourCheck = tablesResult.rows.find(t => t.tablename === 'tours');
    if (tourCheck) {
      const tourCount = await client.query('SELECT COUNT(*) as count FROM tours');
      console.log(`\n📍 Tours in database: ${tourCount.rows[0].count}`);
    }
    
    client.release();
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check if DATABASE_URL is correct');
    console.error('2. Check if PG_SSL setting matches your database provider');
    console.error('3. Verify network connectivity to database server');
    console.error('4. Check database credentials (username, password, host, port)');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
