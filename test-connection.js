#!/usr/bin/env node
/**
 * Connection Diagnostic Tool
 * Test connectivity to livescore server
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const url = require('url');

const LIVESCORE_HOST = process.env.LIVESCORE_HOST || 'http://localhost:1337';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   🔍 LIVESCORE CONNECTION DIAGNOSTIC TOOL 🔍            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`Testing connection to: ${LIVESCORE_HOST}\n`);

// Test 1: Parse URL
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: URL Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
    const parsedUrl = url.parse(LIVESCORE_HOST);
    console.log(`✅ URL is valid`);
    console.log(`   Protocol: ${parsedUrl.protocol}`);
    console.log(`   Hostname: ${parsedUrl.hostname}`);
    console.log(`   Port: ${parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80)}`);
    console.log(`   Path: ${parsedUrl.path || '/'}`);
    
    if (!parsedUrl.protocol) {
        console.log(`\n❌ ERROR: Missing protocol (http:// or https://)`);
        console.log(`   Fix: Add http:// or https:// to LIVESCORE_HOST in .env`);
        process.exit(1);
    }
} catch (error) {
    console.log(`❌ ERROR: Invalid URL format`);
    console.log(`   ${error.message}`);
    process.exit(1);
}

// Test 2: HTTP/HTTPS Request
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: HTTP/HTTPS Connection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const parsedUrl = url.parse(LIVESCORE_HOST);
const protocol = parsedUrl.protocol === 'https:' ? https : http;

console.log('Connecting...');

const startTime = Date.now();

protocol.get(LIVESCORE_HOST, (res) => {
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Connection successful (${elapsed}ms)`);
    console.log(`   Status Code: ${res.statusCode}`);
    console.log(`   Status Message: ${res.statusMessage}`);
    console.log(`   Headers:`);
    Object.keys(res.headers).slice(0, 5).forEach(key => {
        console.log(`      ${key}: ${res.headers[key]}`);
    });
    
    if (res.statusCode === 404) {
        console.log(`\n⚠️  WARNING: Server returned 404 (Not Found)`);
        console.log(`   Server is running, but route doesn't exist`);
        console.log(`   This is OK if server is running Sails.js`);
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`\n✅ Server is running and responding!`);
    } else {
        console.log(`\n⚠️  WARNING: Unexpected status code`);
    }
    
    // Test 3: Socket.io Endpoint
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: Socket.io Endpoint');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const socketUrl = `${LIVESCORE_HOST}/socket.io/?EIO=4&transport=polling`;
    console.log(`Testing: ${socketUrl}`);
    console.log('Connecting...');
    
    protocol.get(socketUrl, (socketRes) => {
        let data = '';
        socketRes.on('data', chunk => data += chunk);
        socketRes.on('end', () => {
            if (socketRes.statusCode === 200) {
                console.log(`✅ Socket.io endpoint is available!`);
                console.log(`   Status: ${socketRes.statusCode}`);
                console.log(`   Response preview: ${data.substring(0, 100)}...`);
                
                // Test 4: Try Socket Connection
                testSocketConnection();
            } else if (socketRes.statusCode === 404) {
                console.log(`❌ Socket.io endpoint NOT FOUND (404)`);
                console.log(`   This is the main problem!`);
                console.log(`\n   Possible causes:`);
                console.log(`   1. Socket.io is not enabled in Sails server`);
                console.log(`   2. Wrong endpoint path`);
                console.log(`   3. Server not configured for socket.io`);
                console.log(`\n   How to fix:`);
                console.log(`   1. Check Sails server config/sockets.js`);
                console.log(`   2. Make sure sockets are not disabled`);
                console.log(`   3. Restart Sails server`);
                
                showSummary('failed', 'Socket.io endpoint not found');
            } else {
                console.log(`⚠️  Unexpected status: ${socketRes.statusCode}`);
                console.log(`   Response: ${data.substring(0, 200)}`);
                
                showSummary('warning', 'Socket.io endpoint returned unexpected status');
            }
        });
    }).on('error', (err) => {
        console.log(`❌ Cannot reach socket.io endpoint`);
        console.log(`   Error: ${err.message}`);
        
        showSummary('failed', 'Socket.io endpoint unreachable');
    });
    
}).on('error', (err) => {
    console.log(`❌ Connection failed`);
    console.log(`   Error: ${err.message}`);
    console.log(`   Code: ${err.code || 'N/A'}`);
    
    console.log(`\n   Common causes:`);
    
    if (err.code === 'ECONNREFUSED') {
        console.log(`   • Server is not running`);
        console.log(`   • Wrong port number`);
        console.log(`   • Server not listening on this interface`);
    } else if (err.code === 'ENOTFOUND') {
        console.log(`   • Wrong hostname`);
        console.log(`   • DNS resolution failed`);
        console.log(`   • Network connectivity issue`);
    } else if (err.code === 'ETIMEDOUT') {
        console.log(`   • Firewall blocking connection`);
        console.log(`   • Server taking too long to respond`);
        console.log(`   • Network issue`);
    }
    
    console.log(`\n   How to fix:`);
    console.log(`   1. Verify LIVESCORE_HOST in .env file`);
    console.log(`   2. Check livescore server is running`);
    console.log(`   3. Test URL in browser: ${LIVESCORE_HOST}`);
    console.log(`   4. Check firewall settings`);
    
    showSummary('failed', err.message);
});

// Test 4: Try actual socket connection
function testSocketConnection() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 4: Socket Connection Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('Attempting to connect with sails.io.js...');
    
    try {
        const socketIOClient = require('socket.io-client');
        const sailsIO = require('sails.io.js');
        
        const io = sailsIO(socketIOClient);
        io.sails.url = LIVESCORE_HOST;
        io.sails.reconnection = false; // Don't retry for test
        io.sails.timeout = 5000;
        
        const timeout = setTimeout(() => {
            console.log('⚠️  Connection timeout (5s)');
            console.log('   Server may be slow or connection blocked');
            showSummary('timeout', 'Connection timeout');
            process.exit(0);
        }, 6000);
        
        io.socket.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ Socket connected successfully!');
            console.log('   Everything is working properly!');
            
            io.socket.disconnect();
            showSummary('success', 'All tests passed!');
        });
        
        io.socket.on('error', (err) => {
            clearTimeout(timeout);
            console.log('❌ Socket connection error');
            console.log(`   ${err.message || err}`);
            
            if (err.description === 404) {
                console.log(`\n   This is the 404 error you're seeing!`);
            }
            
            showSummary('failed', 'Socket connection failed');
        });
        
    } catch (error) {
        console.log('❌ Cannot test socket connection');
        console.log(`   Error: ${error.message}`);
        console.log(`\n   Make sure dependencies are installed:`);
        console.log(`   npm install`);
        
        showSummary('error', 'Missing dependencies');
    }
}

function showSummary(status, message) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      SUMMARY                              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log(`Server: ${LIVESCORE_HOST}`);
    console.log(`Status: ${status.toUpperCase()}`);
    console.log(`Message: ${message}\n`);
    
    if (status === 'success') {
        console.log('✅ All tests passed!');
        console.log('   You can now run: node livescore-listener-improved.js\n');
    } else if (status === 'failed') {
        console.log('❌ Connection failed!');
        console.log('\n📋 Next steps:');
        console.log('   1. Check .env file has correct LIVESCORE_HOST');
        console.log('   2. Make sure livescore server is running');
        console.log('   3. Test server URL in browser');
        console.log('   4. Check firewall settings');
        console.log('   5. Review TROUBLESHOOTING-CONNECTION.md\n');
    } else if (status === 'warning') {
        console.log('⚠️  Partial success');
        console.log('   Some tests passed but socket connection may have issues');
        console.log('   Try running livescore-listener and check logs\n');
    } else if (status === 'timeout') {
        console.log('⏱️  Connection timeout');
        console.log('   Server is slow or connection is blocked');
        console.log('   Check network and firewall settings\n');
    }
    
    console.log('For detailed troubleshooting, see: TROUBLESHOOTING-CONNECTION.md');
    
    process.exit(status === 'success' ? 0 : 1);
}
