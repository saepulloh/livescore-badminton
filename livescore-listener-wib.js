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

// Beregu (turnamen tim, 3x55) — store TERPISAH dari matchData, dibuat malas
// (lazy) cuma untuk court yang benar-benar pernah kedatangan tie beregu,
// BEDA dari matchData yang di-pre-seed semua DAFTAR_LAPANGAN saat startup.
// { lapangan: { context, liveScore, status, lastUpdate, lastContextFetch } }
//   context    = hasil fetch /ligatie/joinRoomWasit (nama klub/pemain/jenis
//                partai — jarang berubah, cuma di-refresh saat event liga*)
//   liveScore  = dibaca LANGSUNG dari payload addPoint (team1setN/durasi,
//                tick tiap poin) — TANPA fetch, persis pola individu
let bereguData = {};
const bereguDebounceTimers = {};   // { lapangan: Timeout } — debounce fetch context per court

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

    // Listen untuk berbagai variasi event score update
    io.socket.on('addPoint', handleUpdateScore);
    io.socket.on('updatescore', handleUpdateScore);  // Real-time score updates
    io.socket.on('updateScore', handleUpdateScore);  // Case variation
    
    // Listen untuk event play/playgame
    io.socket.on('play', handlePlayGame);
    io.socket.on('playgame', handlePlayGame);
    
    // Event lainnya
    io.socket.on('clearLapangan', handleClearLapangan);
    io.socket.on('message', handleMessage);

    // Beregu (turnamen tim) — event terpisah, broadcast ke room court_<nama>
    // yang SAMA dengan individu (sudah ke-join lewat joinCourtRooms di bawah,
    // tidak perlu join room terpisah). Payload event ini cuma raw row (UID,
    // bukan nama) — dipakai murni sebagai SINYAL "refresh context", bukan
    // sumber data langsung (beda dari addPoint yang tetap dibaca langsung,
    // lihat handleUpdateScore).
    io.socket.on('ligaPlay', handleLigaContextEvent);
    io.socket.on('ligaSetpartai', handleLigaContextEvent);
    io.socket.on('ligaClearCourt', handleLigaContextEvent);
    io.socket.on('ligaLineupUpdated', handleLigaContextEvent);
    io.socket.on('ligaScoreUpdate', handleLigaContextEvent);
}

// ============================================
// EVENT HANDLERS - Store data in memory
// ============================================
function handleClearLapangan(data) {
    console.log(`\n${C.green}🏁 CLEARLAPANGAN - Match Finished:${C.reset}`, JSON.stringify(data));
    
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
        // Simpan final score sebelum clear
        matchData[lapangan].finalScore = matchData[lapangan].currentScore ? {...matchData[lapangan].currentScore} : null;
        matchData[lapangan].status = 'finished';
        matchData[lapangan].lastUpdate = getWIBTimestamp();
        matchData[lapangan].finishData = data;
        
        console.log(`   ✅ ${C.yellow}Match finished di court ${lapangan}${C.reset}`);
        
        // Optional: Clear currentScore agar ready untuk match berikutnya
        // Uncomment jika ingin auto-clear setelah match selesai
        // matchData[lapangan].currentScore = null;
    }
}

function handleUpdateScore(data) {
    // Beregu addPoint bawa klasemen_uid truthy (individu selalu 0/falsy,
    // dikonfirmasi ke PertandinganServices.js) — lempar ke handler beregu,
    // badan fungsi individu di bawah ini TIDAK disentuh sama sekali.
    const klasemenUid = data.klasemen_uid ?? (data[0] && data[0].klasemen_uid) ?? 0;
    if (klasemenUid) return handleBereguUpdateScore(data, klasemenUid);

    let preview = JSON.stringify(data);
    console.log(`\n${C.blue}📊 UPDATE SCORE:${C.reset}`, `==>${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}`);

    const event = {
        type: 'updatescore',
        data: data,
        timestamp: new Date().toISOString()
    };
    eventHistory.push(event);
    
    // Extract lapangan
    const lapangan = data.lapangan || data[0]?.lapangan || 'unknown';
    
    // Initialize if not exists
    if (!matchData[lapangan]) {
        matchData[lapangan] = { scores: [], events: [] };
    }
    
    // Store the complete update data
    matchData[lapangan].playData = data;
    matchData[lapangan].lastUpdate = getWIBTimestamp();
    matchData[lapangan].status = 'playing';
    
    // PENTING: Extract dan simpan current score
    // Data bisa dalam berbagai format, kita extract semua kemungkinan
    const scoreData = {
        team1set1: data.team1set1 ?? data.team1Set1 ?? null,
        team2set1: data.team2set1 ?? data.team2Set1 ?? null,
        team1set2: data.team1set2 ?? data.team1Set2 ?? null,
        team2set2: data.team2set2 ?? data.team2Set2 ?? null,
        team1set3: data.team1set3 ?? data.team1Set3 ?? null,
        team2set3: data.team2set3 ?? data.team2Set3 ?? null,
        team1point: data.team1point ?? data.team1Point ?? data.team1_point ?? null,
        team2point: data.team2point ?? data.team2Point ?? data.team2_point ?? null,
        pemenang: data.pemenang ?? data.winner ?? null,
        retired: data.retired ?? null,
        durasi: data.durasi ?? data.duration ?? null
    };
    
    // Simpan ke currentScore - ini yang akan digunakan oleh vmix endpoint
    matchData[lapangan].currentScore = scoreData;
    
    // Log untuk debugging
    console.log(`   📍 Court ${lapangan}: Set1(${scoreData.team1set1}-${scoreData.team2set1}) Set2(${scoreData.team1set2}-${scoreData.team2set2}) Set3(${scoreData.team1set3}-${scoreData.team2set3}) Current(${scoreData.team1point}-${scoreData.team2point})`);
}

function handlePlayGame(data) {
    logHeader('🎯 PLAYGAME - NEW MATCH');
    let preview = JSON.stringify(data);
    console.log(`\n${C.blue}▶️  Play-New-Game:${C.reset}`, `==>${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}`);
    
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
    matchData[lapangan].playData = data;
    matchData[lapangan].lastUpdate = getWIBTimestamp();
    matchData[lapangan].status = 'on_court';
    
    // Also update initialData.match for backward compatibility
    if (!matchData[lapangan].initialData) {
        matchData[lapangan].initialData = {};
    }
    matchData[lapangan].initialData.match = data;
    
    // PENTING: RESET currentScore untuk match baru - SELALU reset, bukan cek if
    // Ini memastikan score dari match lama tidak terbawa ke match baru
    matchData[lapangan].currentScore = {
        team1set1: data.team1set1 ?? 0,
        team2set1: data.team2set1 ?? 0,
        team1set2: data.team1set2 ?? 0,
        team2set2: data.team2set2 ?? 0,
        team1set3: data.team1set3 ?? 0,
        team2set3: data.team2set3 ?? 0,
        team1point: data.team1point ?? 0,
        team2point: data.team2point ?? 0,
        pemenang: data.pemenang ?? 0,
        retired: data.retired ?? 0,
        durasi: data.durasi ?? 0
    };
    
    console.log(`   🔄 ${C.green}Score RESET untuk match baru di court ${lapangan}${C.reset}`);
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
// BEREGU (turnamen tim, 3x55) — HANDLERS
// ============================================
// Semua event liga* di bawah cuma bawa row mentah (UID, tanpa nama) —
// dipakai sebagai sinyal "ada perubahan, refresh context", BUKAN payload
// yang dikonsumsi langsung. Skor yang tick tiap poin (addPoint) TETAP dibaca
// langsung dari payload tanpa fetch — lihat handleBereguUpdateScore.

const LIGA_CONTEXT_DEBOUNCE_MS = 800;

// Cari nomor lapangan dari payload event liga*. Kebanyakan event bawa
// klasemenMatch.live_court langsung; ligaLineupUpdated cuma bawa
// {klasemen_uid} tanpa live_court, jadi fallback reverse-lookup ke court
// yang sudah kita punya context-nya.
function resolveLapanganFromLigaEvent(data) {
    const liveCourt = data && data.klasemenMatch && data.klasemenMatch.live_court;
    if (liveCourt) return String(liveCourt);

    const klasemenUid = (data && data.klasemen_uid) ?? (data && data.klasemenMatch && data.klasemenMatch.uid);
    if (klasemenUid) {
        for (const lap of Object.keys(bereguData)) {
            const ctx = bereguData[lap] && bereguData[lap].context;
            if (ctx && ctx.klasemenMatch && ctx.klasemenMatch.uid === klasemenUid) {
                return lap;
            }
        }
    }
    return null;
}

function handleLigaContextEvent(data) {
    const preview = JSON.stringify(data);
    console.log(`\n${C.magenta}🏆 LIGA EVENT:${C.reset}`, `==>${preview.substring(0, 120)}${preview.length > 120 ? '...' : ''}`);

    eventHistory.push({ type: 'liga_event', data: data, timestamp: new Date().toISOString() });

    const lapangan = resolveLapanganFromLigaEvent(data);
    if (!lapangan) {
        console.log(`   ${C.yellow}⚠️  Tidak bisa resolve lapangan dari liga event, di-skip${C.reset}`);
        return;
    }

    // Bikin stub segera supaya endpoint /vmix-flat-beregu dkk tidak 404 di
    // jeda antara "event fired" dan "fetch debounced selesai".
    if (!bereguData[lapangan]) {
        bereguData[lapangan] = { context: {}, liveScore: {}, status: 'waiting', lastUpdate: null, lastContextFetch: null };
    }

    // Debounce per court — beberapa event liga* bisa berturut-turut dalam
    // waktu singkat (mis. selectServer+selectReceiver+PLAY di wasit beregu),
    // cuma event TERAKHIR dalam jendela 800ms yang benar-benar memicu fetch.
    if (bereguDebounceTimers[lapangan]) {
        clearTimeout(bereguDebounceTimers[lapangan]);
    }
    bereguDebounceTimers[lapangan] = setTimeout(() => {
        delete bereguDebounceTimers[lapangan];
        fetchBereguContext(lapangan);
    }, LIGA_CONTEXT_DEBOUNCE_MS);
}

// GET /ligatie/joinRoomWasit?lapangan=X — dipanggil HTTP-over-socket lewat
// koneksi yang sama (bukan request HTTP terpisah). Cuma dipicu event liga*
// (jarang, di batas partai/set), BUKAN tiap poin.
function fetchBereguContext(lapangan) {
    const io = global.io;
    if (!io || !io.socket) return; // belum connect — no-op aman

    io.socket.get('/ligatie/joinRoomWasit', { lapangan: lapangan }, (body, response) => {
        if (!response || response.statusCode !== 200 || !body) {
            console.log(`   ${C.yellow}⚠️  Beregu context fetch gagal court ${lapangan}: ${response ? response.statusCode : 'no response'}${C.reset}`);
            return; // biarkan context lama apa adanya, jangan throw
        }

        // KRITIS: endpoint ini pakai res.ok() -> envelope {status,code,data}.
        // BEDA dari /pertandingan/joinRoomWasit (individu) yang sudah polos.
        const payload = body.data ?? body;
        if (!payload) return;

        if (!bereguData[lapangan]) {
            bereguData[lapangan] = { context: {}, liveScore: {}, status: 'waiting', lastUpdate: null, lastContextFetch: null };
        }

        if (!payload.tie) {
            // Court idle untuk beregu — simpan info lapangan_label/scoreboard_image,
            // kosongkan sisanya supaya tie lama tidak nyangkut.
            bereguData[lapangan].context = {
                klasemenMatch: null, club1_name: '', club2_name: '', pertandingan: null,
                partai: [], lineup: [], livematch: null, partaiCategories: [],
                lapangan_label: payload.lapangan_label ?? lapangan,
                scoreboard_image: payload.scoreboard_image ?? '',
                tie: false
            };
            bereguData[lapangan].status = 'waiting';
        } else {
            bereguData[lapangan].context = {
                klasemenMatch: payload.klasemenMatch ?? null,
                club1_name: payload.club1_name ?? '',
                club2_name: payload.club2_name ?? '',
                pertandingan: payload.pertandingan ?? null,
                partai: payload.partai ?? [],
                lineup: payload.lineup ?? [],
                livematch: payload.livematch ?? null,
                partaiCategories: payload.partaiCategories ?? [],
                lapangan_label: payload.lapangan_label ?? lapangan,
                scoreboard_image: payload.scoreboard_image ?? '',
                tie: true
            };
            bereguData[lapangan].status = (payload.klasemenMatch && payload.klasemenMatch.status === 'finished') ? 'finished' : 'on_court';
        }
        bereguData[lapangan].lastContextFetch = getWIBTimestamp();
        bereguData[lapangan].lastUpdate = getWIBTimestamp();

        const preview = JSON.stringify(bereguData[lapangan].context);
        console.log(`   ${C.green}✅ Beregu context refreshed court ${lapangan}${C.reset}: ${preview.substring(0, 100)}...`);
    });
}

// Dipanggil dari handleUpdateScore saat data.klasemen_uid truthy (tie
// beregu) — baca LANGSUNG dari payload addPoint, TANPA fetch. Field skor
// mentah (team1setN/team2setN/durasi) tetap ada di payload beregu walau
// sub-objek nama match.team1/team2 dikosongkan backend.
function handleBereguUpdateScore(data, klasemenUid) {
    const preview = JSON.stringify(data);
    console.log(`\n${C.blue}📊 BEREGU UPDATE SCORE:${C.reset}`, `==>${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}`);

    eventHistory.push({ type: 'beregu_addPoint', data: data, timestamp: new Date().toISOString() });

    const lapangan = data.lapangan || (data[0] && data[0].lapangan) || resolveLapanganFromLigaEvent({ klasemenMatch: { uid: klasemenUid } }) || 'unknown';

    if (!bereguData[lapangan]) {
        bereguData[lapangan] = { context: {}, liveScore: {}, status: 'playing', lastUpdate: null, lastContextFetch: null };
    }

    bereguData[lapangan].liveScore = {
        klasemen_uid: klasemenUid,
        team1set1: data.team1set1 ?? null,
        team2set1: data.team2set1 ?? null,
        team1set2: data.team1set2 ?? null,
        team2set2: data.team2set2 ?? null,
        team1set3: data.team1set3 ?? null,
        team2set3: data.team2set3 ?? null,
        team1point: data.team1point ?? null,
        team2point: data.team2point ?? null,
        pemenang: data.pemenang ?? null,
        retired: data.retired ?? null,
        durasi: data.durasi ?? data.duration ?? null
    };
    bereguData[lapangan].status = 'playing';
    bereguData[lapangan].lastUpdate = getWIBTimestamp();

    const ls = bereguData[lapangan].liveScore;
    console.log(`   📍 Beregu Court ${lapangan}: Set1(${ls.team1set1}-${ls.team2set1}) Set2(${ls.team1set2}-${ls.team2set2}) Set3(${ls.team1set3}-${ls.team2set3}) Current(${ls.team1point}-${ls.team2point})`);
}

// Bangun objek flat vMix untuk 1 court beregu — dipakai bersama endpoint
// JSON (/vmix-flat-beregu) dan XML (/vmix-xml-beregu). SEMUA akses field
// pakai ?./??/|| defensif — court tanpa tie beregu (atau belum sempat
// di-fetch) tetap harus balas 200 dengan default aman, TIDAK PERNAH throw
// (pelajaran dari crash produksi /vmix-flat sebelumnya).
function buildBereguFlat(lap) {
    const courtData = bereguData[lap] || {};
    const ctx = courtData.context || {};
    const live = courtData.liveScore || {};
    const klasemenMatch = ctx.klasemenMatch || {};
    const livematch = ctx.livematch || {};
    const pertandingan = ctx.pertandingan || {};

    const currentSet = livematch.current_set ?? 1;
    const currentPartai = livematch.current_partai ?? 1;

    const partaiRow = (ctx.partai || []).find(p => p.set_no === currentSet && p.partai_no === currentPartai) || {};
    const partaiType = partaiRow.partai_type || '';
    const category = (ctx.partaiCategories || []).find(c => c.alias === partaiType) || {};
    const partaiLabel = category.nama || '';

    // Balikan objek {nama, lastname} per pemain (bukan string polos) — supaya
    // bisa dipetakan ke team1_player1_name/_displayName persis
    // konvensi individu (lihat komentar di bawah).
    function playersFor(clubUid) {
        return (ctx.lineup || [])
            .filter(l => l.club === clubUid && l.set_no === currentSet && l.partai_type === partaiType)
            .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
            .map(l => ({ nama: l.pemain_nama || '', lastname: l.pemain_lastname || '' }))
            .filter(p => p.nama || p.lastname);
    }
    const team1Players = playersFor(klasemenMatch.club1);
    const team2Players = playersFor(klasemenMatch.club2);

    // Nama pendek/tampil per pemain — persis konvensi individu
    // (PertandinganServices.getPlayer(): displayName1 = pemain.lastname,
    // dipakai duluan; lastname1 = pemain.nama, fallback kalau lastname kosong).
    // lineup beregu punya field yang SAMA (pemain_lastname/pemain_nama), jadi
    // bisa dipetakan 1:1 tanpa data tambahan.
    function shortName(p) { return p ? (p.lastname || p.nama || '') : ''; }
    const team1Name1 = shortName(team1Players[0]);
    const team1Name2 = shortName(team1Players[1]);
    const team2Name1 = shortName(team2Players[0]);
    const team2Name2 = shortName(team2Players[1]);

    function setScore(setNo) {
        return {
            s1: live[`team1set${setNo}`] ?? pertandingan[`team1set${setNo}`] ?? 0,
            s2: live[`team2set${setNo}`] ?? pertandingan[`team2set${setNo}`] ?? 0
        };
    }
    let setsWon1 = 0, setsWon2 = 0;
    for (let s = 1; s < currentSet; s++) {
        const { s1, s2 } = setScore(s);
        if (s1 || s2) { if (s1 > s2) setsWon1++; else if (s2 > s1) setsWon2++; }
    }

    const servTeam = livematch.serv_team ?? 0;
    const set1 = setScore(1), set2 = setScore(2), set3 = setScore(3);

    return {
        court: lap,
        status: courtData.status || 'unknown',

        // Belum ada sumber nama turnamen di payload manapun (gap backend,
        // buildTiePayload tidak resolve tournament_uid -> nama) — dikosongkan.
        tournament_name: '',
        round: '',
        match_number: currentPartai,

        // *_name = nama LENGKAP (lineup.pemain_nama), *_displayName = nama pendek
        // (lineup.pemain_lastname) — persis konvensi individu. teamN_playerM_club
        // = nama KLUB tim (semua pemain satu tim berasal dari klub yang sama).
        team1_player1_name: team1Players[0] ? team1Players[0].nama : '',
        team1_player1_displayName: team1Name1,
        team1_player1_club: ctx.club1_name || '',
        team1_player2_name: team1Players[1] ? team1Players[1].nama : '',
        team1_player2_displayName: team1Name2,
        team1_player2_club: team1Players[1] ? (ctx.club1_name || '') : '',
        team1_displayName: [team1Name1, team1Name2].filter(Boolean).join(' / '),
        team1_serve: servTeam === 1,

        team2_player1_name: team2Players[0] ? team2Players[0].nama : '',
        team2_player1_displayName: team2Name1,
        team2_player1_club: ctx.club2_name || '',
        team2_player2_name: team2Players[1] ? team2Players[1].nama : '',
        team2_player2_displayName: team2Name2,
        team2_player2_club: team2Players[1] ? (ctx.club2_name || '') : '',
        team2_displayName: [team2Name1, team2Name2].filter(Boolean).join(' / '),
        team2_serve: servTeam === 2,

        team1_set1: set1.s1, team2_set1: set1.s2,
        team1_set2: set2.s1, team2_set2: set2.s2,
        team1_set3: set3.s1, team2_set3: set3.s2,

        team1_current: live.team1point ?? 0,
        team2_current: live.team2point ?? 0,

        winner: live.pemenang ?? klasemenMatch.winner ?? 0,
        retired: 0,
        duration: live.durasi ?? pertandingan.durasi ?? 0,

        // --- field khusus beregu, ditambahkan di akhir ---
        partai_type: partaiType,
        partai_label: partaiLabel,
        current_set: currentSet,
        sets_won_team1: setsWon1,
        sets_won_team2: setsWon2,

        last_update: courtData.lastUpdate || getWIBTimestamp(),
        update_time: getWIBTimestampShort()
    };
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
                    
                    // Jika ada match info di initial data, set sebagai matchInfo
                    if (body.match) {
                        matchData[lapangan].matchInfo = body.match;
                        matchData[lapangan].playData = body.match;
                        // Initialize currentScore dari match info
                        matchData[lapangan].currentScore = {
                            team1set1: body.match.team1set1 ?? 0,
                            team2set1: body.match.team2set1 ?? 0,
                            team1set2: body.match.team1set2 ?? 0,
                            team2set2: body.match.team2set2 ?? 0,
                            team1set3: body.match.team1set3 ?? 0,
                            team2set3: body.match.team2set3 ?? 0,
                            team1point: body.match.team1point ?? 0,
                            team2point: body.match.team2point ?? 0
                        };
                    }
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

📡 Events (individu):
   • ${C.green}clearLapangan${C.reset}  → Match finished
   • ${C.blue}updatescore${C.reset}    → Real-time score updates ⭐
   • ${C.blue}play${C.reset}           → Dari joinRoomWasit
   • ${C.blue}playgame${C.reset}       → Match on court

📡 Events (beregu/turnamen tim):
   • ${C.magenta}ligaPlay / ligaSetpartai / ligaClearCourt${C.reset} → Sinyal refresh context
   • ${C.magenta}ligaLineupUpdated / ligaScoreUpdate${C.reset}       → Sinyal refresh context
   • ${C.blue}addPoint${C.reset} (klasemen_uid truthy)              → Skor real-time, tanpa fetch

🏟️  Rooms: ${joinedRooms.join(', ')}

🌐 HTTP Server: http://localhost:${PORT}
   ${C.magenta}vMix Endpoints (individu):${C.reset}
   • ${C.bright}/vmix-flat?id=N${C.reset}  → Flat JSON (recommended) ⭐
   • ${C.bright}/vmix-xml?id=N${C.reset}   → XML format

   ${C.magenta}vMix Endpoints (beregu):${C.reset}
   • ${C.bright}/vmix-flat-beregu?id=N${C.reset}  → Flat JSON (recommended) ⭐
   • ${C.bright}/vmix-xml-beregu?id=N${C.reset}   → XML format

   ${C.cyan}Other Endpoints:${C.reset}
   • /listpertandingan  → All match data
   • /lapangan?id=N     → Specific court (full data)
   • /debug?id=N        → Debug internal data structure (individu)
   • /debug-beregu?id=N → Debug internal data structure (beregu)
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
                
            case '/debug':
                // Debug endpoint - show internal data structure
                if (lap && matchData[lap]) {
                    res.writeHead(200);
                    const courtData = matchData[lap];
                    res.end(JSON.stringify({
                        success: true,
                        timestamp: getWIBTimestamp(),
                        lapangan: lap,
                        debug_info: {
                            status: courtData.status,
                            has_matchInfo: !!courtData.matchInfo,
                            has_currentScore: !!courtData.currentScore,
                            has_playData: !!courtData.playData,
                            has_finalScore: !!courtData.finalScore,
                            lastUpdate: courtData.lastUpdate
                        },
                        matchInfo: courtData.matchInfo || null,
                        currentScore: courtData.currentScore || null,
                        finalScore: courtData.finalScore || null,
                        playData_preview: courtData.playData ? 
                            JSON.stringify(courtData.playData).substring(0, 200) + '...' : null,
                        recent_events: eventHistory.filter(e => {
                            const eventData = e.data[0] || e.data;
                            return eventData.lapangan === lap || e.data.lapangan === lap;
                        }).slice(-5)
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
                    // console.log('serv_team', courtData.matchInfo.livematch[0].serv_team);
                    //console.log('livematch', courtData.playData);
                    //res.end(JSON.stringify(courtData.playData.livematch[0], null, 2));
                    // Build flat structure for vMix
                    // PRIORITAS: currentScore > matchInfo > default 0
                    const servTeam = playData.livematch?.[0]?.serv_team || 0;
                    
                    const vmixData = {
                        // Court info
                        court: lap,
                        status: courtData.status || 'unknown',
                        
                        // Tournament info
                        tournament_name: matchInfo.kelompok_pertandingan?.nama || '',
                        round: matchInfo.round || '',
                        match_number: matchInfo.nr || '',
                        
                        // Team 1 — *_name = nama LENGKAP (pemain.nama), *_displayName = nama pendek (pemain.lastname)
                        team1_player1_name: team1.lastname1 || '',
                        team1_player1_displayName: team1.displayName1 || team1.lastname1 || '',
                        team1_player1_club: team1.player1_club || '',
                        team1_player2_name: team1.lastname2 || '',
                        team1_player2_displayName: team1.displayName2 || team1.lastname2 || '',
                        team1_player2_club: team1.player2_club || '',
                        team1_displayName : (team1.displayName1 || '') +  (team1.displayName2 ? " / " + team1.displayName2 : ""),
                        team1_serve : servTeam === 1,

                        // Team 2
                        team2_player1_name: team2.lastname1 || '',
                        team2_player1_displayName: team2.displayName1 || team2.lastname1 || '',
                        team2_player1_club: team2.player1_club || '',
                        team2_player2_name: team2.lastname2 || '',
                        team2_player2_displayName: team2.displayName2 || team2.lastname2 || '',
                        team2_player2_club: team2.player2_club || '',
                        team2_displayName : (team2.displayName1 || '') +  (team2.displayName2 ? " / " + team2.displayName2 : ""),
                        team2_serve : servTeam === 2,
                        
                        
                        // Scores - PRIORITAS DARI currentScore (real-time)
                        // Gunakan nullish coalescing dengan prioritas: currentScore > matchInfo > 0
                        team1_set1: currentScore.team1set1 ?? matchInfo.team1set1 ?? 0,
                        team2_set1: currentScore.team2set1 ?? matchInfo.team2set1 ?? 0,
                        team1_set2: currentScore.team1set2 ?? matchInfo.team1set2 ?? 0,
                        team2_set2: currentScore.team2set2 ?? matchInfo.team2set2 ?? 0,
                        team1_set3: currentScore.team1set3 ?? matchInfo.team1set3 ?? 0,
                        team2_set3: currentScore.team2set3 ?? matchInfo.team2set3 ?? 0,
                        
                        // Current game scores (dari updatescore)
                        team1_current: currentScore.team1point ?? 0,
                        team2_current: currentScore.team2point ?? 0,
                        
                        // Match status
                        winner: currentScore.pemenang ?? matchInfo.pemenang ?? 0,
                        retired: currentScore.retired ?? matchInfo.retired ?? 0,
                        duration: currentScore.durasi ?? matchInfo.durasi ?? 0,
                        
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
                    
                    // Build XML structure - prioritas dari currentScore
                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<match>
  <court>${lap}</court>
  <status>${courtData.status || 'unknown'}</status>
  <tournament>${matchInfo.kelompok_pertandingan?.nama || ''}</tournament>
  <round>${matchInfo.round || ''}</round>
  <match_number>${matchInfo.nr || ''}</match_number>
  
  <team1>
    <player1_name>${team1.lastname1 || ''}</player1_name>
    <player1_displayName>${team1.displayName1 || team1.lastname1 || ''}</player1_displayName>
    <player1_club>${team1.player1_club || ''}</player1_club>
    <player2_name>${team1.lastname2 || ''}</player2_name>
    <player2_displayName>${team1.displayName2 || team1.lastname2 || ''}</player2_displayName>
    <player2_club>${team1.player2_club || ''}</player2_club>
    <displayName>${(team1.displayName1 || '') + (team1.displayName2 ? " / " + team1.displayName2 : "")}</displayName>
    <serve>${(playData.livematch?.[0]?.serv_team || 0) === 1}</serve>
  </team1>
  
  <team2>
    <player1_name>${team2.lastname1 || ''}</player1_name>
    <player1_displayName>${team2.displayName1 || team2.lastname1 || ''}</player1_displayName>
    <player1_club>${team2.player1_club || ''}</player1_club>
    <player2_name>${team2.lastname2 || ''}</player2_name>
    <player2_displayName>${team2.displayName2 || team2.lastname2 || ''}</player2_displayName>
    <player2_club>${team2.player2_club || ''}</player2_club>
    <displayName>${(team2.displayName1 || '') + (team2.displayName2 ? " / " + team2.displayName2 : "")}</displayName>
    <serve>${(playData.livematch?.[0]?.serv_team || 0) === 2}</serve>
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
    <winner>${currentScore.pemenang ?? matchInfo.pemenang ?? 0}</winner>
    <retired>${currentScore.retired ?? matchInfo.retired ?? 0}</retired>
    <duration>${currentScore.durasi ?? matchInfo.durasi ?? 0}</duration>
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

            // ============================================
            // BEREGU (turnamen tim) — endpoint TERPISAH, TIDAK menyentuh
            // /vmix-flat, /vmix-xml, /vmix, /debug individu di atas sama
            // sekali. Operator broadcast ganti URL sesuai jenis turnamen.
            // ============================================
            case '/vmix-flat-beregu':
                if (lap && bereguData[lap]) {
                    res.writeHead(200);
                    res.end(JSON.stringify([buildBereguFlat(lap)], null, 2));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({
                        error: 'Court not found (beregu)',
                        available: Object.keys(bereguData)
                    }, null, 2));
                }
                break;

            case '/vmix-xml-beregu': {
                res.setHeader('Content-Type', 'text/xml');
                if (lap && bereguData[lap]) {
                    res.writeHead(200);
                    const v = buildBereguFlat(lap);
                    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<match>
  <court>${v.court}</court>
  <status>${v.status}</status>
  <tournament>${v.tournament_name}</tournament>
  <partai_type>${v.partai_type}</partai_type>
  <partai_label>${v.partai_label}</partai_label>
  <current_set>${v.current_set}</current_set>
  <match_number>${v.match_number}</match_number>

  <team1>
    <player1_name>${v.team1_player1_name}</player1_name>
    <player1_displayName>${v.team1_player1_displayName}</player1_displayName>
    <player1_club>${v.team1_player1_club}</player1_club>
    <player2_name>${v.team1_player2_name}</player2_name>
    <player2_displayName>${v.team1_player2_displayName}</player2_displayName>
    <player2_club>${v.team1_player2_club}</player2_club>
    <displayName>${v.team1_displayName}</displayName>
    <serve>${v.team1_serve}</serve>
  </team1>

  <team2>
    <player1_name>${v.team2_player1_name}</player1_name>
    <player1_displayName>${v.team2_player1_displayName}</player1_displayName>
    <player1_club>${v.team2_player1_club}</player1_club>
    <player2_name>${v.team2_player2_name}</player2_name>
    <player2_displayName>${v.team2_player2_displayName}</player2_displayName>
    <player2_club>${v.team2_player2_club}</player2_club>
    <displayName>${v.team2_displayName}</displayName>
    <serve>${v.team2_serve}</serve>
  </team2>

  <scores>
    <team1_set1>${v.team1_set1}</team1_set1>
    <team2_set1>${v.team2_set1}</team2_set1>
    <team1_set2>${v.team1_set2}</team1_set2>
    <team2_set2>${v.team2_set2}</team2_set2>
    <team1_set3>${v.team1_set3}</team1_set3>
    <team2_set3>${v.team2_set3}</team2_set3>
    <team1_current>${v.team1_current}</team1_current>
    <team2_current>${v.team2_current}</team2_current>
    <sets_won_team1>${v.sets_won_team1}</sets_won_team1>
    <sets_won_team2>${v.sets_won_team2}</sets_won_team2>
  </scores>

  <metadata>
    <winner>${v.winner}</winner>
    <duration>${v.duration}</duration>
    <last_update>${v.last_update}</last_update>
    <update_time>${v.update_time}</update_time>
  </metadata>
</match>`;
                    res.end(xml);
                } else {
                    res.writeHead(404);
                    res.end(`<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Court not found (beregu)</message>
  <available>${Object.keys(bereguData).join(',')}</available>
</error>`);
                }
                break;
            }

            case '/debug-beregu':
                if (lap && bereguData[lap]) {
                    res.writeHead(200);
                    const courtData = bereguData[lap];
                    res.end(JSON.stringify({
                        success: true,
                        timestamp: getWIBTimestamp(),
                        lapangan: lap,
                        debug_info: {
                            status: courtData.status,
                            has_context: !!(courtData.context && courtData.context.tie),
                            has_liveScore: !!(courtData.liveScore && courtData.liveScore.klasemen_uid),
                            lastUpdate: courtData.lastUpdate,
                            lastContextFetch: courtData.lastContextFetch
                        },
                        context: courtData.context || null,
                        liveScore: courtData.liveScore || null
                    }, null, 2));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Lapangan not found (beregu)',
                        available: Object.keys(bereguData)
                    }, null, 2));
                }
                break;

            case '/clear':
                // Clear all data (for testing)
                matchData = {};
                eventHistory = [];
                bereguData = {};
                Object.keys(bereguDebounceTimers).forEach(lap2 => {
                    clearTimeout(bereguDebounceTimers[lap2]);
                    delete bereguDebounceTimers[lap2];
                });
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
                        '/debug?id=N': 'Debug internal data structure for specific court',
                        '/vmix?id=N': 'Get match data (nested structure)',
                        '/vmix-flat?id=N': 'Get vMix-friendly flat JSON data ⭐ RECOMMENDED FOR VMIX (individu)',
                        '/vmix-xml?id=N': 'Get vMix-friendly XML data (individu)',
                        '/vmix-flat-beregu?id=N': 'Get vMix-friendly flat JSON data ⭐ RECOMMENDED (beregu/turnamen tim)',
                        '/vmix-xml-beregu?id=N': 'Get vMix-friendly XML data (beregu/turnamen tim)',
                        '/debug-beregu?id=N': 'Debug internal data structure for specific court (beregu)',
                        '/clear': 'Clear all stored data'
                    },
                    vmix_integration: {
                        json: 'Use /vmix-flat?id=N (individu) atau /vmix-flat-beregu?id=N (beregu) untuk GT Title Designer/Web input',
                        xml: 'Use /vmix-xml?id=N (individu) atau /vmix-xml-beregu?id=N (beregu) untuk Data Source (XML)',
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
                        '/debug?id=N (debugging)',
                        '/vmix-flat?id=N (vMix recommended, individu)',
                        '/vmix-xml?id=N (individu)',
                        '/vmix-flat-beregu?id=N (vMix recommended, beregu)',
                        '/vmix-xml-beregu?id=N (beregu)',
                        '/debug-beregu?id=N (debugging, beregu)',
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