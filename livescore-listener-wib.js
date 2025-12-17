#!/usr/bin/env node
/**
 * Livescore Socket Listener
 * Menggunakan sails.io.js untuk kompatibilitas dengan Sails
 * 
 * Features:
 * - Listen socket events dari LIVESCORE_HOST
 * - Simpan data pertandingan di memori
 * - HTTP endpoint /listpertandingan untuk melihat data
 * 
 * Usage:
 *   node livescore-listener.js
 */

require('dotenv').config();
const http = require('http');
const url = require('url');

// ============================================
// CONFIGURATION
// ============================================
const LIVESCORE_HOST = process.env.LIVESCORE_HOST || 'http://localhost:1337';
const DAFTAR_LAPANGAN = (process.env.DAFTAR_LAPANGAN || '1,2,3,4,5,6,7,8,9,10,11,12')
    .split(',')
    .map(l => l.trim())
    .filter(l => l !== '');
const PORT = parseInt(process.env.PORT || '6969');

// ============================================
// IN-MEMORY DATA STORAGE
// ============================================
let matchData = {};          // { lapangan: { matchInfo, scores, lastUpdate } }
let eventHistory = [];       // Array of all events received
let joinedRooms = [];
let connectionStatus = 'disconnected';

// Colors
const C = {
    reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m',
    yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};

function log(color, ...args) { console.log(color, ...args, C.reset); }

function logHeader(title) {
    console.log(`\n${C.cyan}╔${'═'.repeat(60)}╗`);
    console.log(`║  ${title.padEnd(58)}║`);
    console.log(`╚${'═'.repeat(60)}╝${C.reset}\n`);
}

function logSection(title) {
    console.log(`\n${C.yellow}▶ ${title}${C.reset}`);
    console.log('─'.repeat(50));
}

// ============================================
// GET LAPANGAN LIST FROM ENV
// ============================================
function getLapanganList() {
    logSection('Loading Daftar Lapangan from ENV');
    
    const lapanganList = DAFTAR_LAPANGAN.map(nama => ({
        nama: nama,
        uid: nama  // Use nama as uid since we don't have database
    }));
    
    log(C.green, `✅ Found ${lapanganList.length} lapangan`);
    console.log('\n📋 Daftar Lapangan:');
    lapanganList.forEach((lap, idx) => {
        console.log(`   ${idx + 1}. Lapangan ${lap.nama}`);
    });
    
    return lapanganList;
}

// ============================================
// SOCKET - Initialize sails.io.js
// ============================================
function initSailsSocket() {
    logSection('Initializing Sails Socket');
    console.log(`   URL: ${LIVESCORE_HOST}`);
    
    const socketIOClient = require('socket.io-client');
    const sailsIO = require('sails.io.js');
    
    console.log(`   sails.io.js: ${require('sails.io.js/package.json').version}`);
    console.log(`   socket.io-client: ${require('socket.io-client/package.json').version}`);
    
    const io = sailsIO(socketIOClient);
    
    io.sails.url = LIVESCORE_HOST;
    io.sails.transports = ['polling', 'websocket'];
    io.sails.useCORSRouteToGetCookie = false;
    io.sails.reconnection = true;
    
    return io;
}

// ============================================
// MAIN LOGIC after connection
// ============================================
async function onConnected(io) {
    log(C.green, '\n✅ Connected to Sails!');
    connectionStatus = 'connected';
    
    setupBroadcastListeners(io);
    
    const lapanganList = getLapanganList();
    if (lapanganList.length > 0) {
        await joinCourtRooms(io, lapanganList);
    }
    
    showListeningStatus();
}

function setupBroadcastListeners(io) {
    log(C.green, '✅ Setting up listeners...');
    
    io.socket.on('clearLapangan', handleClearLapangan);
    io.socket.on('play', handlePlay);
    io.socket.on('playgame', handlePlayGame);
    io.socket.on('updatescore', handleUpdateScore);
    io.socket.on('message', handleMessage);
}

// ============================================
// EVENT HANDLERS - Store data in memory
// ============================================
function handleClearLapangan(data) {
    console.log(`\n${C.green}🏁 CLEARLAPANGAN:${C.reset}`, JSON.stringify(data));
    
    const event = {
        type: 'clearLapangan',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
    
    // Extract lapangan from data
    const lapangan = data[0]?.lapangan || data.lapangan || 'unknown';
    
    // Clear match data for this lapangan
    if (matchData[lapangan]) {
        matchData[lapangan].status = 'finished';
        matchData[lapangan].lastUpdate = getWIBTimestamp();
        matchData[lapangan].finishData = data;
    }
}

function handlePlay(data) {
    console.log(`\n${C.blue}▶️  PLAY:${C.reset}`, JSON.stringify(data));
    
    const event = {
        type: 'play',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
    
    // Store play data
    const lapangan = data.lapangan || data[0]?.lapangan || 'unknown';
    if (!matchData[lapangan]) {
        matchData[lapangan] = { scores: [], events: [] };
    }
    matchData[lapangan].playData = data;
    matchData[lapangan].lastUpdate = getWIBTimestamp();
    matchData[lapangan].status = 'playing';
}

function handlePlayGame(data) {
    logHeader('🎯 PLAYGAME');
    console.log(JSON.stringify(data, null, 2));
    
    const event = {
        type: 'playgame',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
    
    // Store playgame data - this usually contains match details
    const lapangan = data.lapangan || data[0]?.lapangan || 'unknown';
    if (!matchData[lapangan]) {
        matchData[lapangan] = { scores: [], events: [] };
    }
    matchData[lapangan].matchInfo = data;
    matchData[lapangan].lastUpdate = getWIBTimestamp();
    matchData[lapangan].status = 'on_court';
    
    // Also update initialData.match for backward compatibility
    if (!matchData[lapangan].initialData) {
        matchData[lapangan].initialData = {};
    }
    matchData[lapangan].initialData.match = data;
}

function handleUpdateScore(data) {
    console.log(`\n${C.yellow}📊 UPDATESCORE:${C.reset}`, JSON.stringify(data));
    
    const event = {
        type: 'updatescore',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
    
    // Store score data
    const lapangan = data.lapangan || data[0]?.lapangan || 'unknown';
    if (!matchData[lapangan]) {
        matchData[lapangan] = { scores: [], events: [] };
    }
    
    // Add score to history
    matchData[lapangan].scores.push({
        data: data,
        timestamp: getWIBTimestamp()
    });
    
    // Update current score
    matchData[lapangan].currentScore = data;
    matchData[lapangan].lastUpdate = getWIBTimestamp();
    matchData[lapangan].status = 'playing';
    
    // Also update score in initialData.match if it exists (for backward compatibility)
    if (matchData[lapangan].initialData && matchData[lapangan].initialData.match) {
        // Update score fields in the match object
        Object.assign(matchData[lapangan].initialData.match, data);
    }
}

function handleMessage(data) {
    console.log(`\n${C.magenta}📨 MESSAGE:${C.reset}`, JSON.stringify(data));
    
    const event = {
        type: 'message',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
}

// ============================================
// JOIN ROOMS
// ============================================
async function joinCourtRooms(io, lapanganList) {
    logSection('Joining Court Rooms');
    console.log('   Endpoint: /pertandingan/joinRoomWasit\n');
    for (const lap of lapanganList) {
        await joinRoom(io, lap.nama);
        await sleep(200);
    }
    log(C.green, `\n✅ Joined ${joinedRooms.length} rooms`);
}

function joinRoom(io, lapangan) {
    return new Promise((resolve) => {
        const room = `court_${lapangan}`;
        
        io.socket.get('/pertandingan/joinRoomWasit', { lapangan: lapangan }, (body, response) => {
            if (response && response.statusCode === 200) {
                console.log(`   ${C.green}✅ ${room}${C.reset}`);
                joinedRooms.push(room);
                
                // Initialize match data storage for this lapangan
                if (!matchData[lapangan]) {
                    matchData[lapangan] = { 
                        scores: [], 
                        events: [],
                        status: 'waiting',
                        joinedAt: getWIBTimestamp()
                    };
                }
                
                // Store initial data if returned
                if (body && Object.keys(body).length > 0) {
                    const preview = JSON.stringify(body);
                    console.log(`      └─ ${preview.substring(0, 70)}${preview.length > 70 ? '...' : ''}`);
                    matchData[lapangan].initialData = body;
                    matchData[lapangan].lastUpdate = getWIBTimestamp();
                }
            } else {
                const status = response ? response.statusCode : 'timeout';
                console.log(`   ${C.yellow}⚠️  ${room}: ${status}${C.reset}`);
                joinedRooms.push(room);
            }
            resolve();
        });
        
        setTimeout(() => {
            if (!joinedRooms.includes(room)) {
                console.log(`   ${C.yellow}⚠️  ${room}: Timeout${C.reset}`);
                joinedRooms.push(room);
            }
            resolve();
        }, 3000);
    });
}

function showListeningStatus() {
    console.log(`
${C.cyan}════════════════════════════════════════════════════════════════
👂 LISTENING FOR BROADCASTS...
════════════════════════════════════════════════════════════════${C.reset}

📡 Events:
   • ${C.green}clearLapangan${C.reset}  → Match finished
   • ${C.blue}play${C.reset}           → Dari joinRoomWasit
   • ${C.blue}playgame${C.reset}       → Match on court
   • ${C.yellow}updatescore${C.reset}    → Real-time score

🏟️  Rooms: ${joinedRooms.join(', ')}

🌐 HTTP Server: http://localhost:${PORT}
   ${C.magenta}vMix Endpoints:${C.reset}
   • ${C.bright}/vmix-flat?id=N${C.reset}  → Flat JSON (recommended) ⭐
   • ${C.bright}/vmix-xml?id=N${C.reset}   → XML format
   
   ${C.cyan}Other Endpoints:${C.reset}
   • /listpertandingan  → All match data
   • /lapangan?id=N     → Specific court (full data)
   • /status            → Connection status
   • /events            → Event history

${C.yellow}⏳ Menunggu broadcast... (Ctrl+C untuk stop)${C.reset}
────────────────────────────────────────────────────────────────
`);
}

// ============================================
// HTTP SERVER
// ============================================
function startHttpServer() {
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        const lap = parsedUrl.query.id;
        switch (pathname) {
            case '/listpertandingan':
            case '/pertandingan':
                // Return match data from all courts
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    timestamp: getWIBTimestamp(),
                    connectionStatus: connectionStatus,
                    joinedRooms: joinedRooms,
                    totalCourts: Object.keys(matchData).length,
                    data: matchData
                }, null, 2));
                break;
                
            case '/status':
                // Return connection status
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    timestamp: getWIBTimestamp(),
                    livescoreHost: LIVESCORE_HOST,
                    connectionStatus: connectionStatus,
                    joinedRooms: joinedRooms,
                    daftarLapangan: DAFTAR_LAPANGAN,
                    totalEvents: eventHistory.length,
                    uptime: process.uptime()
                }, null, 2));
                break;
                
            case '/events':
                // Return event history (last 100 events)
                const limit = parseInt(parsedUrl.query.limit) || 100;
                const recentEvents = eventHistory.slice(-limit);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    timestamp: getWIBTimestamp(),
                    totalEvents: eventHistory.length,
                    showing: recentEvents.length,
                    events: recentEvents
                }, null, 2));
                break;
                
            case '/lapangan':
                // Return specific lapangan data
               if (lap && matchData[lap]) {
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        success: true,
                        timestamp: getWIBTimestamp(),
                        lapangan: lap,
                        data: matchData[lap]
                    }, null, 2));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Lapangan not found',
                        available: Object.keys(matchData)
                    }, null, 2));
                }

                break;
            case '/vmix':
                // Return specific lapangan data (real-time updated)
                if (lap && matchData[lap]) {
                    res.writeHead(200);
                    
                    // Combine all available data - prioritize real-time updates
                    const courtData = matchData[lap];
                    
                    // Build response from real-time data
                    const responseData = {
                        // Match info from playgame event
                        ...(courtData.matchInfo || {}),
                        // Current score from updatescore event
                        currentScore: courtData.currentScore || null,
                        // Latest play data
                        playData: courtData.playData || null,
                        // Status and metadata
                        status: courtData.status || 'unknown',
                        lastUpdate: courtData.lastUpdate || getWIBTimestamp(),
                        // Score history for reference
                        scoreHistory: courtData.scores || []
                    };
                    
                    // Remove unwanted properties if they exist
                    delete responseData.livematch;
                    delete responseData.history;
                    
                    res.end(JSON.stringify([{
                        success: true,
                        timestamp: getWIBTimestamp(),
                        lapangan: lap,
                        data: responseData
                    }], null, 2));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Lapangan not found',
                        available: Object.keys(matchData)
                    }, null, 2));
                }
                break;
                
            case '/vmix-flat':
                // vMix-friendly flat structure endpoint
                if (lap && matchData[lap]) {
                    res.writeHead(200);
                    
                    const courtData = matchData[lap];
                    const playData = courtData.playData || {};
                    const matchInfo = courtData.matchInfo || playData;
                    const currentScore = courtData.currentScore || {};
                    
                    // Extract team data
                    const team1 = matchInfo.team1 || {};
                    const team2 = matchInfo.team2 || {};
                    
                    // Build flat structure for vMix
                    const vmixData = {
                        // Court info
                        court: lap,
                        status: courtData.status || 'unknown',
                        
                        // Tournament info
                        tournament_name: matchInfo.kelompok_pertandingan?.nama || '',
                        round: matchInfo.round || '',
                        match_number: matchInfo.nr || '',
                        
                        // Team 1
                        team1_name: team1.displayName1 || team1.lastname1 || '',
                        team1_firstname: team1.firstname1 || '',
                        team1_lastname: team1.lastname1 || '',
                        team1_club: team1.player1_club || '',
                        team1_player2_name: team1.displayName2 || team1.lastname2 || '',
                        
                        // Team 2
                        team2_name: team2.displayName1 || team2.lastname1 || '',
                        team2_firstname: team2.firstname1 || '',
                        team2_lastname: team2.lastname1 || '',
                        team2_club: team2.player1_club || '',
                        team2_player2_name: team2.displayName2 || team2.lastname2 || '',
                        
                        // Scores - from current score or match info
                        team1_set1: currentScore.team1set1 ?? matchInfo.team1set1 ?? 0,
                        team2_set1: currentScore.team2set1 ?? matchInfo.team2set1 ?? 0,
                        team1_set2: currentScore.team1set2 ?? matchInfo.team1set2 ?? 0,
                        team2_set2: currentScore.team2set2 ?? matchInfo.team2set2 ?? 0,
                        team1_set3: currentScore.team1set3 ?? matchInfo.team1set3 ?? 0,
                        team2_set3: currentScore.team2set3 ?? matchInfo.team2set3 ?? 0,
                        
                        // Current game scores (if available from updatescore)
                        team1_current: currentScore.team1point || 0,
                        team2_current: currentScore.team2point || 0,
                        
                        // Match status
                        winner: matchInfo.pemenang || 0,
                        retired: matchInfo.retired || 0,
                        duration: matchInfo.durasi || 0,
                        
                        // Metadata with WIB timezone
                        last_update: courtData.lastUpdate || getWIBTimestamp(),
                        update_time: getWIBTimestampShort()  // Short format: HH:MM:SS
                    };
                    
                    // Return WITHOUT array wrapper and minimal wrapper
                    res.end(JSON.stringify([vmixData], null, 2));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({
                        error: 'Court not found',
                        available: Object.keys(matchData)
                    }, null, 2));
                }
                break;
                
            case '/vmix-xml':
                // vMix XML format endpoint
                if (lap && matchData[lap]) {
                    res.setHeader('Content-Type', 'text/xml');
                    res.writeHead(200);
                    
                    const courtData = matchData[lap];
                    const playData = courtData.playData || {};
                    const matchInfo = courtData.matchInfo || playData;
                    const currentScore = courtData.currentScore || {};
                    
                    const team1 = matchInfo.team1 || {};
                    const team2 = matchInfo.team2 || {};
                    
                    // Build XML structure
                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<match>
  <court>${lap}</court>
  <status>${courtData.status || 'unknown'}</status>
  <tournament>${matchInfo.kelompok_pertandingan?.nama || ''}</tournament>
  <round>${matchInfo.round || ''}</round>
  <match_number>${matchInfo.nr || ''}</match_number>
  
  <team1>
    <name>${team1.displayName1 || team1.lastname1 || ''}</name>
    <firstname>${team1.firstname1 || ''}</firstname>
    <lastname>${team1.lastname1 || ''}</lastname>
    <club>${team1.player1_club || ''}</club>
    <player2_name>${team1.displayName2 || team1.lastname2 || ''}</player2_name>
  </team1>
  
  <team2>
    <name>${team2.displayName1 || team2.lastname1 || ''}</name>
    <firstname>${team2.firstname1 || ''}</firstname>
    <lastname>${team2.lastname1 || ''}</lastname>
    <club>${team2.player1_club || ''}</club>
    <player2_name>${team2.displayName2 || team2.lastname2 || ''}</player2_name>
  </team2>
  
  <scores>
    <team1_set1>${currentScore.team1set1 ?? matchInfo.team1set1 ?? 0}</team1_set1>
    <team2_set1>${currentScore.team2set1 ?? matchInfo.team2set1 ?? 0}</team2_set1>
    <team1_set2>${currentScore.team1set2 ?? matchInfo.team1set2 ?? 0}</team1_set2>
    <team2_set2>${currentScore.team2set2 ?? matchInfo.team2set2 ?? 0}</team2_set2>
    <team1_set3>${currentScore.team1set3 ?? matchInfo.team1set3 ?? 0}</team1_set3>
    <team2_set3>${currentScore.team2set3 ?? matchInfo.team2set3 ?? 0}</team2_set3>
    <team1_current>${currentScore.team1point || 0}</team1_current>
    <team2_current>${currentScore.team2point || 0}</team2_current>
  </scores>
  
  <metadata>
    <winner>${matchInfo.pemenang || 0}</winner>
    <retired>${matchInfo.retired || 0}</retired>
    <duration>${matchInfo.durasi || 0}</duration>
    <last_update>${courtData.lastUpdate || getWIBTimestamp()}</last_update>
    <update_time>${getWIBTimestampShort()}</update_time>
  </metadata>
</match>`;
                    
                    res.end(xml);
                } else {
                    res.setHeader('Content-Type', 'text/xml');
                    res.writeHead(404);
                    res.end(`<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Court not found</message>
  <available>${Object.keys(matchData).join(',')}</available>
</error>`);
                }
                break;    
            case '/clear':
                // Clear all data (for testing)
                matchData = {};
                eventHistory = [];
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: 'All data cleared'
                }, null, 2));
                break;
                
            case '/':
                // Home page with API docs
                res.writeHead(200);
                res.end(JSON.stringify({
                    name: 'Livescore Socket Listener',
                    version: '1.0.0',
                    status: connectionStatus,
                    endpoints: {
                        '/listpertandingan': 'Get all match data from all courts',
                        '/status': 'Get connection status and configuration',
                        '/events': 'Get event history (use ?limit=N for pagination)',
                        '/lapangan?id=N': 'Get data for specific court',
                        '/vmix?id=N': 'Get match data (nested structure)',
                        '/vmix-flat?id=N': 'Get vMix-friendly flat JSON data ⭐ RECOMMENDED FOR VMIX',
                        '/vmix-xml?id=N': 'Get vMix-friendly XML data',
                        '/clear': 'Clear all stored data'
                    },
                    vmix_integration: {
                        json: 'Use /vmix-flat?id=N for GT Title Designer or Web input',
                        xml: 'Use /vmix-xml?id=N for Data Source (XML)',
                        polling_interval: '1000ms recommended (1 second)'
                    },
                    livescoreHost: LIVESCORE_HOST,
                    joinedRooms: joinedRooms
                }, null, 2));
                break;
                
            default:
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Not found',
                    availableEndpoints: [
                        '/', 
                        '/listpertandingan', 
                        '/status', 
                        '/events', 
                        '/lapangan?id=N', 
                        '/vmix-flat?id=N (vMix recommended)', 
                        '/vmix-xml?id=N',
                        '/clear'
                    ]
                }, null, 2));
        }
    });
    
    server.listen(PORT, () => {
        log(C.green, `\n🌐 HTTP Server running on http://localhost:${PORT}`);
    });
    
    return server;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================
// WIB FORMATTER
// ============================================
function getWIBTimestamp() {
    const date = new Date();
    // WIB = UTC+7
    const wibOffset = 7 * 60; // 7 hours in minutes
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (wibOffset * 60000));
    
    // Format: DD Mon YYYY, HH:MM:SS WIB
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(wibTime.getDate()).padStart(2, '0');
    const month = months[wibTime.getMonth()];
    const year = wibTime.getFullYear();
    const hours = String(wibTime.getHours()).padStart(2, '0');
    const minutes = String(wibTime.getMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getSeconds()).padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;
}

function getWIBTimestampShort() {
    const date = new Date();
    const wibOffset = 7 * 60;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (wibOffset * 60000));
    
    // Format: HH:MM:SS
    const hours = String(wibTime.getHours()).padStart(2, '0');
    const minutes = String(wibTime.getMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

// ============================================
// MAIN
// ============================================
async function main() {
    logHeader('🏸 LIVESCORE SOCKET LISTENER');
    
    console.log('📋 Configuration:');
    console.log(`   Livescore Host : ${LIVESCORE_HOST}`);
    console.log(`   HTTP Port      : ${PORT}`);
    console.log(`   Daftar Lapangan: ${DAFTAR_LAPANGAN.join(', ')}`);
    
    // Start HTTP server first
    const httpServer = startHttpServer();
    
    // Initialize socket connection
    const io = initSailsSocket();
    
    console.log('\n🔌 Connecting to socket...');
    
    io.socket.on('connect', () => onConnected(io));
    
    io.socket.on('disconnect', () => {
        log(C.yellow, '\n🔌 Disconnected');
        connectionStatus = 'disconnected';
    });
    
    io.socket.on('reconnect', () => {
        log(C.green, '🔄 Reconnected!');
        connectionStatus = 'connected';
    });
    
    io.socket.on('error', (err) => {
        log(C.red, '❌ Socket error:', err);
        connectionStatus = 'error';
    });
    
    global.io = io;
    global.httpServer = httpServer;
}

process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    if (global.io && global.io.socket) {
        global.io.socket.disconnect();
        console.log('   ✅ Socket disconnected');
    }
    if (global.httpServer) {
        global.httpServer.close();
        console.log('   ✅ HTTP Server closed');
    }
    console.log('👋 Goodbye!\n');
    process.exit(0);
});

main().catch(console.error);
