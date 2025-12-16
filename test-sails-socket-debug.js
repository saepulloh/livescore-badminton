#!/usr/bin/env node
/**
 * Sails Socket Listener - Debug Mode
 * Menggunakan sails.io.js untuk kompatibilitas dengan Sails
 * 
 * Usage:
 *   node test-sails-socket-debug.js [URL] [TOURNAMENT_UID]
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// ============================================
// CONFIGURATION
// ============================================
const SOCKET_URL = process.argv[2] || process.env.SAILS_SOCKET_URL || 'http://localhost:1337';
const TOURNAMENT_UID = parseInt(process.argv[3] || process.env.TOURNAMENT_UID || '144');

const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'badminton'
};

let dbPool = null;
let joinedRooms = [];

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
// DATABASE
// ============================================
async function initDatabase() {
    logSection('Connecting to MySQL');
    try {
        dbPool = mysql.createPool({
            ...MYSQL_CONFIG,
            connectionLimit: 5
        });
        const conn = await dbPool.getConnection();
        log(C.green, '✅ MySQL connected');
        console.log(`   Host: ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
        console.log(`   Database: ${MYSQL_CONFIG.database}`);
        conn.release();
        return true;
    } catch (error) {
        log(C.red, '❌ MySQL failed:', error.message);
        return false;
    }
}

async function getLapanganList() {
    logSection(`Fetching Lapangan (Tournament: ${TOURNAMENT_UID})`);
    try {
        const [rows] = await dbPool.execute(
            'SELECT uid, nama FROM lapangan WHERE tournament_uid = ? ORDER BY nama',
            [TOURNAMENT_UID]
        );
        log(C.green, `✅ Found ${rows.length} lapangan`);
        if (rows.length > 0) {
            console.log('\n📋 Daftar Lapangan:');
            rows.forEach((row, idx) => console.log(`   ${idx + 1}. Lapangan ${row.nama} (uid: ${row.uid})`));
        }
        return rows;
    } catch (error) {
        log(C.red, '❌ Error:', error.message);
        return [];
    }
}

async function getMatchByID(matchID) {
    try {
        const [rows] = await dbPool.execute(
            'SELECT * FROM pertandingan WHERE uid = ?',
            [matchID]
        );
        return rows;
    } catch (error) {
        log(C.red, '❌ Error fetching match:', error.message);
        return [];
    }
}

// ============================================
// SOCKET - Initialize sails.io.js
// ============================================
function initSailsSocket() {
    logSection('Initializing Sails Socket');
    console.log(`   URL: ${SOCKET_URL}`);
    
    const socketIOClient = require('socket.io-client');
    const sailsIO = require('sails.io.js');
    
    console.log(`   sails.io.js: ${require('sails.io.js/package.json').version}`);
    console.log(`   socket.io-client: ${require('socket.io-client/package.json').version}`);
    
    const io = sailsIO(socketIOClient);
    
    io.sails.url = SOCKET_URL;
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
    
    setupBroadcastListeners(io);
    
    const lapanganList = await getLapanganList();
    if (lapanganList.length > 0) {
        await joinCourtRooms(io, lapanganList);
    } else {
        await joinDefaultRooms(io);
    }
    
    showListeningStatus();
}

function setupBroadcastListeners(io) {
    log(C.green, '✅ Setting up listeners...');
    
    io.socket.on('clearLapangan', handleClearLapangan);
    io.socket.on('play', (data) => console.log(`\n${C.blue}▶️  PLAY:${C.reset}`, JSON.stringify(data)));
    io.socket.on('playgame', (data) => { logHeader('🎯 PLAYGAME'); console.log(JSON.stringify(data, null, 2)); });
    io.socket.on('updatescore', (data) => console.log(`\n${C.yellow}📊 UPDATESCORE:${C.reset}`, JSON.stringify(data)));
    io.socket.on('message', (data) => console.log(`\n${C.magenta}📨 MESSAGE:${C.reset}`, JSON.stringify(data)));
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

async function joinDefaultRooms(io) {
    logSection('Joining Default Rooms (1-10)');
    for (let i = 1; i <= 10; i++) {
        await joinRoom(io, String(i));
        await sleep(200);
    }
}

function joinRoom(io, lapangan) {
    return new Promise((resolve) => {
        const room = `court_${lapangan}`;
        
        io.socket.get('/pertandingan/joinRoomWasit', { lapangan: lapangan }, (body, response) => {
            if (response && response.statusCode === 200) {
                console.log(`   ${C.green}✅ ${room}${C.reset}`);
                joinedRooms.push(room);
                if (body && Object.keys(body).length > 0) {
                    const preview = JSON.stringify(body);
                    console.log(`      └─ ${preview.substring(0, 70)}${preview.length > 70 ? '...' : ''}`);
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
   • ${C.green}clearLapangan${C.reset}  → Score untuk BTP
   • ${C.blue}play${C.reset}           → Dari joinRoomWasit
   • ${C.blue}playgame${C.reset}       → Match on court
   • ${C.yellow}updatescore${C.reset}    → Real-time score

🏟️  Rooms: ${joinedRooms.join(', ')}

${C.yellow}⏳ Menunggu broadcast... (Ctrl+C untuk stop)${C.reset}
────────────────────────────────────────────────────────────────
`);
}

// ============================================
// BTP MAPPING FUNCTIONS
// ============================================

/**
 * Build network_score array dari individual set scores
 * Format: [[team1_game1, team2_game1], [team1_game2, team2_game2], ...]
 */
function buildNetworkScore(match) {
    const scores = [];
    
    // Set 1
    const t1s1 = match.team1set1 || 0;
    const t2s1 = match.team2set1 || 0;
    if (t1s1 > 0 || t2s1 > 0) {
        scores.push([t1s1, t2s1]);
    }
    
    // Set 2
    const t1s2 = match.team1set2 || 0;
    const t2s2 = match.team2set2 || 0;
    if (t1s2 > 0 || t2s2 > 0) {
        scores.push([t1s2, t2s2]);
    }
    
    // Set 3 (rubber game)
    const t1s3 = match.team1set3 || 0;
    const t2s3 = match.team2set3 || 0;
    if (t1s3 > 0 || t2s3 > 0) {
        scores.push([t1s3, t2s3]);
    }
    
    // Set 4 & 5 (untuk format lain)
    const t1s4 = match.team1Set4 || 0;
    const t2s4 = match.team2Set4 || 0;
    if (t1s4 > 0 || t2s4 > 0) {
        scores.push([t1s4, t2s4]);
    }
    
    const t1s5 = match.team1Set5 || 0;
    const t2s5 = match.team2Set5 || 0;
    if (t1s5 > 0 || t2s5 > 0) {
        scores.push([t1s5, t2s5]);
    }
    
    return scores;
}

/**
 * Determine if team1 won
 */
function determineWinner(match, networkScore) {
    // Prioritas 1: Field pemenang dari database
    if (match.pemenang !== undefined && match.pemenang !== null) {
        return match.pemenang === 1;
    }
    
    // Prioritas 2: Field menang (berisi team_uid yang menang)
    if (match.menang && match.team1) {
        return match.menang === match.team1;
    }
    
    // Prioritas 3: Hitung dari score
    if (networkScore.length > 0) {
        let team1Sets = 0;
        let team2Sets = 0;
        
        networkScore.forEach(([t1, t2]) => {
            if (t1 > t2) team1Sets++;
            else if (t2 > t1) team2Sets++;
        });
        
        return team1Sets > team2Sets;
    }
    
    return false;
}

/**
 * Calculate duration in milliseconds
 */
function calculateDuration(match) {
    // Jika ada starttime dan endtime
    if (match.starttime && match.endtime) {
        const start = new Date(match.starttime).getTime();
        const end = new Date(match.endtime).getTime();
        if (start > 0 && end > 0 && end > start) {
            return end - start;
        }
    }
    
    // Jika ada field durasi (asumsi dalam menit)
    if (match.durasi && match.durasi > 0) {
        return match.durasi * 60 * 1000;  // Convert menit ke ms
    }
    
    return 0;
}

/**
 * Map Match data ke format BTP
 */
function mapToBTPFormat(match) {
    const networkScore = buildNetworkScore(match);
    const team1Won = determineWinner(match, networkScore);
    const durationMs = calculateDuration(match);
    
    return {
        // === Required BTP Fields ===
        duration_ms: durationMs,
        end_ts: match.endtime ? new Date(match.endtime).getTime() : Date.now(),
        network_score: networkScore,
        team1_won: team1Won,
        presses: [],  // Tidak tersedia dari Sails
        
        // === Identifiers ===
        court_id: String(match.lapangan || ''),
        pertandingan_uid: match.uid || null,
        tournament_id: match.tournament_uid || null,
        
        // === Optional ===
        shuttle_count: 0,
        
        // === Match Info (untuk reference) ===
        match_info: {
            draw_uid: match.draw || null,
            entry_uid: match.entry || null,
            round: match.round || '',
            team1_uid: match.team1 || null,
            team2_uid: match.team2 || null,
            status: match.status || null,
            retired: match.retired === 1,
            plandate: match.plandate || null
        }
    };
}

// ============================================
// HANDLE CLEARLAPANGAN
// ============================================
async function handleClearLapangan(data) {
    console.log(`
${C.green}${'🟢'.repeat(30)}
🏁 CLEARLAPANGAN - MATCH FINISHED!
   Time: ${new Date().toLocaleTimeString()}
${'🟢'.repeat(30)}${C.reset}
`);

    // 1. RAW DATA dari socket
    logSection('1. RAW SOCKET DATA');
    console.log(JSON.stringify(data, null, 2));

    // 2. Get match from database
    const matchID = data[0]?.match || data.match || data.uid;
    if (!matchID) {
        log(C.red, '❌ No match ID found in data');
        return null;
    }

    logSection(`2. FETCHING MATCH (ID: ${matchID})`);
    const matchRows = await getMatchByID(matchID);
    
    if (matchRows.length === 0) {
        log(C.red, '❌ Match not found in database');
        return null;
    }

    const match = matchRows[0];
    console.log(`   ✅ Found match: ${match.uid}`);
    console.log(`   📍 Lapangan: ${match.lapangan}`);
    console.log(`   🏆 Pemenang: Team ${match.pemenang}`);

    // 3. Show all fields
    logSection('3. MATCH FIELDS');
    console.log(`   Total: ${Object.keys(match).length} fields\n`);
    Object.keys(match).forEach(key => {
        const val = match[key];
        const type = Array.isArray(val) ? 'array' : typeof val;
        let display = JSON.stringify(val);
        if (display && display.length > 60) display = display.substring(0, 60) + '...';
        console.log(`   ${C.bright}${key}${C.reset} (${type}): ${display}`);
    });

    // 4. Map to BTP format
    logSection('4. BTP FORMAT');
    const btpData = mapToBTPFormat(match);
    console.log(JSON.stringify(btpData, null, 2));

    // 5. Validation
    logSection('5. VALIDATION');
    const checks = [
        { field: 'network_score', ok: btpData.network_score.length > 0, val: `${btpData.network_score.length} game(s)` },
        { field: 'court_id', ok: !!btpData.court_id, val: btpData.court_id || 'Missing' },
        { field: 'duration_ms', ok: btpData.duration_ms > 0, val: formatDuration(btpData.duration_ms) },
        { field: 'team1_won', ok: btpData.team1_won !== undefined, val: String(btpData.team1_won) },
        { field: 'pertandingan_uid', ok: !!btpData.pertandingan_uid, val: btpData.pertandingan_uid || 'Missing' },
        { field: 'tournament_id', ok: !!btpData.tournament_id, val: btpData.tournament_id || 'Missing' }
    ];
    
    checks.forEach(c => {
        const icon = c.ok ? '✅' : '⚠️';
        console.log(`   ${icon} ${c.field}: ${c.val}`);
    });

    // 6. Summary
    logSection('6. SUMMARY');
    console.log(`   📍 Lapangan     : ${btpData.court_id}`);
    console.log(`   🏆 Score        : ${JSON.stringify(btpData.network_score)}`);
    console.log(`   👑 Winner       : Team ${btpData.team1_won ? '1' : '2'}`);
    console.log(`   ⏱️  Duration     : ${formatDuration(btpData.duration_ms)}`);
    console.log(`   🔑 Match UID    : ${btpData.pertandingan_uid}`);
    console.log(`   🏟️  Tournament   : ${btpData.tournament_id}`);
    console.log(`   📋 Round        : ${btpData.match_info.round}`);

    console.log(`
${C.cyan}════════════════════════════════════════════════════════════════
✅ DATA READY FOR BTP SUBMISSION
════════════════════════════════════════════════════════════════${C.reset}
`);

    return btpData;
}

/**
 * Format duration from ms to readable string
 */
function formatDuration(ms) {
    if (!ms || ms === 0) return 'N/A';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================
// MAIN
// ============================================
async function main() {
    logHeader('🏸 SAILS SOCKET LISTENER - DEBUG MODE');
    
    console.log('📋 Configuration:');
    console.log(`   Sails Socket  : ${SOCKET_URL}`);
    console.log(`   MySQL Host    : ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
    console.log(`   Database      : ${MYSQL_CONFIG.database}`);
    console.log(`   Tournament    : ${TOURNAMENT_UID}`);
    
    await initDatabase();
    
    const io = initSailsSocket();
    
    console.log('\n🔌 Connecting...');
    
    io.socket.on('connect', () => onConnected(io));
    
    io.socket.on('disconnect', () => {
        log(C.yellow, '\n🔌 Disconnected');
    });
    
    io.socket.on('reconnect', () => {
        log(C.green, '🔄 Reconnected!');
    });
    
    io.socket.on('error', (err) => {
        log(C.red, '❌ Socket error:', err);
    });
    
    global.io = io;
}

process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    if (global.io && global.io.socket) {
        global.io.socket.disconnect();
        console.log('   ✅ Socket disconnected');
    }
    if (dbPool) {
        await dbPool.end();
        console.log('   ✅ Database closed');
    }
    console.log('👋 Goodbye!\n');
    process.exit(0);
});

main().catch(console.error);