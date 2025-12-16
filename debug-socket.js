#!/usr/bin/env node
/**
 * Socket Connection Debug Tool
 * Shows exact URLs being requested
 */

require('dotenv').config();

const LIVESCORE_HOST = process.env.LIVESCORE_HOST || 'http://localhost:1337';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║        🔍 SOCKET CONNECTION DEBUG TOOL 🔍                ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`Server: ${LIVESCORE_HOST}\n`);

// Test 1: Manual socket.io-client (without sails.io.js wrapper)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Direct socket.io-client (no sails.io.js wrapper)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
    const io = require('socket.io-client');
    
    console.log('Connecting with raw socket.io-client...');
    console.log(`URL: ${LIVESCORE_HOST}`);
    console.log('Options: { transports: ["polling"] }\n');
    
    const socket = io(LIVESCORE_HOST, {
        transports: ['polling'],
        reconnection: false,
        timeout: 5000
    });
    
    const timeout1 = setTimeout(() => {
        console.log('❌ Connection timeout (5s)\n');
        socket.disconnect();
        testSailsIO();
    }, 6000);
    
    socket.on('connect', () => {
        clearTimeout(timeout1);
        console.log('✅ Direct socket.io-client CONNECTED!\n');
        console.log(`   Socket ID: ${socket.id}`);
        console.log('   This means socket.io server is working!\n');
        socket.disconnect();
        
        testSailsIO();
    });
    
    socket.on('connect_error', (err) => {
        clearTimeout(timeout1);
        console.log('❌ Connection error:');
        console.log(`   ${err.message}`);
        if (err.description) {
            console.log(`   Status: ${err.description}`);
        }
        console.log('');
        socket.disconnect();
        
        testSailsIO();
    });
    
} catch (error) {
    console.log('❌ Error loading socket.io-client:');
    console.log(`   ${error.message}\n`);
    testSailsIO();
}

// Test 2: sails.io.js wrapper
function testSailsIO() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: With sails.io.js wrapper');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        const socketIOClient = require('socket.io-client');
        const sailsIO = require('sails.io.js');
        
        const io = sailsIO(socketIOClient);
        
        // Enable debug logging
        io.sails.environment = 'development';
        
        io.sails.url = LIVESCORE_HOST;
        io.sails.transports = ['polling'];
        io.sails.reconnection = false;
        io.sails.timeout = 5000;
        
        console.log('Connecting with sails.io.js...');
        console.log(`URL: ${LIVESCORE_HOST}`);
        console.log('Transport: polling\n');
        
        // Intercept the request to see what URL is being used
        const originalGet = io.socket._raw.io.engine.transport.doRequest;
        
        const timeout2 = setTimeout(() => {
            console.log('❌ Connection timeout (5s)\n');
            io.socket.disconnect();
            showSummary();
        }, 6000);
        
        io.socket.on('connect', () => {
            clearTimeout(timeout2);
            console.log('✅ sails.io.js CONNECTED!\n');
            console.log('   Everything is working!\n');
            io.socket.disconnect();
            showSummary();
        });
        
        io.socket.on('error', (err) => {
            clearTimeout(timeout2);
            console.log('❌ sails.io.js connection error:');
            console.log(`   ${err.message || err}`);
            
            if (err.description) {
                console.log(`   HTTP Status: ${err.description}`);
            }
            
            if (err.context && err.context.responseText) {
                console.log(`   Response: ${err.context.responseText}`);
            }
            
            console.log('\n💡 Possible issue:');
            console.log('   sails.io.js might be using different URL/endpoint\n');
            
            io.socket.disconnect();
            showSummary();
        });
        
    } catch (error) {
        console.log('❌ Error with sails.io.js:');
        console.log(`   ${error.message}\n`);
        showSummary();
    }
}

function showSummary() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('If Test 1 (direct socket.io-client) works:');
    console.log('  → Server is OK');
    console.log('  → Problem is sails.io.js wrapper\n');
    
    console.log('If Test 1 fails:');
    console.log('  → Server configuration issue');
    console.log('  → Check Sails socket.io configuration\n');
    
    console.log('If Test 2 (sails.io.js) fails:');
    console.log('  → sails.io.js compatibility issue');
    console.log('  → Try alternative: use socket.io-client directly\n');
    
    console.log('Next steps:');
    console.log('  1. If Test 1 works → Use socket.io-client version');
    console.log('  2. If both fail → Check server configuration');
    console.log('  3. See: FIX-SAILS-IO-ALTERNATIVE.md\n');
    
    process.exit(0);
}
