const dns = require('dns');
const { exec } = require('child_process');

console.log('🔍 Testing Supabase connectivity...\n');

const hostname = 'db.ljoprvntgeeyhfimbwoi.supabase.co';

// Test 1: DNS resolution with default resolver
console.log('1️⃣  Testing DNS resolution (default)...');
dns.resolve(hostname, (err, addresses) => {
  if (err) {
    console.log('   ❌ Error:', err.code);
  } else {
    console.log('   ✅ Resolved to:', addresses);
  }
  
  // Test 2: Test connectivity with telnet/nc
  console.log('\n2️⃣  Testing port 5432 connectivity...');
  exec(`powershell -Command "Test-NetConnection -ComputerName ${hostname} -Port 5432 -WarningAction SilentlyContinue | Select-Object -Property TcpTestSucceeded"`, (err, stdout, stderr) => {
    if (stdout.includes('True')) {
      console.log('   ✅ Port 5432 is reachable');
    } else {
      console.log('   ❌ Port 5432 is NOT reachable');
    }
    
    // Test 3: Try to connect with pg library
    console.log('\n3️⃣  Testing PostgreSQL connection...');
    const { Pool } = require('pg');
    const pool = new Pool({
      host: hostname,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Duyvip3012@',
      ssl: false,
      connectionTimeoutMillis: 5000
    });
    
    pool.connect((err, client, release) => {
      if (err) {
        console.log('   ❌ Connection failed:', err.message);
      } else {
        console.log('   ✅ Connected to PostgreSQL!');
        client.query('SELECT NOW()', (err, result) => {
          if (err) {
            console.log('   ❌ Query failed:', err.message);
          } else {
            console.log('   ✅ Query successful. Server time:', result.rows[0].now);
          }
          release();
          pool.end();
        });
      }
    });
  });
});
