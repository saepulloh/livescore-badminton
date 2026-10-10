# 🎬 vMix Integration Guide

Panduan lengkap untuk mengintegrasikan livescore-listener dengan vMix untuk menampilkan scoreboard badminton secara real-time, baik untuk **pertandingan individu** maupun **beregu (turnamen tim)**.

---

## 📋 Daftar Isi
- [Individu vs Beregu](#individu-vs-beregu)
- [Endpoint yang Tersedia](#endpoint-yang-tersedia)
- [Setup vMix - Flat JSON](#setup-vmix---flat-json-recommended)
- [Setup vMix - XML](#setup-vmix---xml)
- [Contoh Data](#contoh-data)
- [Field Mapping](#field-mapping)
- [Troubleshooting](#troubleshooting)

---

## 🔀 Individu vs Beregu

Listener menyimpan data individu dan beregu **secara terpisah**. Operator broadcast memilih URL sesuai jenis turnamen yang sedang berlangsung:

| Jenis turnamen | JSON ⭐ | XML |
|----------------|--------|-----|
| **Individu** | `/vmix-flat?id=N` | `/vmix-xml?id=N` |
| **Beregu** (tim, 3x55) | `/vmix-flat-beregu?id=N` | `/vmix-xml-beregu?id=N` |

Nama field di kedua jenis **sama**, sehingga GT Title individu bisa dipakai ulang untuk beregu cukup dengan mengganti URL. Beregu hanya menambah beberapa field (lihat [Field Mapping](#field-mapping)).

---

## 🔗 Endpoint yang Tersedia

### 1. `/vmix-flat?id=N` dan `/vmix-flat-beregu?id=N` ⭐ **RECOMMENDED**
Format: **Flat JSON** (dibungkus array: `[ {...} ]`)  
Cocok untuk: **GT Title Designer** atau **Web input**

**URL Example:**
```
http://localhost:6969/vmix-flat?id=1
http://localhost:6969/vmix-flat-beregu?id=1
```

**Keuntungan:**
- ✅ Struktur flat, mudah di-mapping
- ✅ Field names simple tanpa nested object
- ✅ Auto-update setiap poin (skor dan indikator serve)
- ✅ Format JSON standar

---

### 2. `/vmix-xml?id=N` dan `/vmix-xml-beregu?id=N`
Format: **XML**  
Cocok untuk: **Data Source (XML)**

**URL Example:**
```
http://localhost:6969/vmix-xml?id=1
http://localhost:6969/vmix-xml-beregu?id=1
```

**Keuntungan:**
- ✅ Native vMix XML support
- ✅ Easy drag-and-drop mapping
- ✅ Struktur hierarchical yang jelas

---

### 3. Endpoint debug
| Endpoint | Fungsi |
|----------|--------|
| `/debug?id=N` | Struktur data internal court individu |
| `/debug-beregu?id=N` | Struktur data internal court beregu (context + liveScore) |

---

## 🚀 Setup vMix - Flat JSON (Recommended)

### Method 1: GT Title Designer + Web Input

#### Step 1: Jalankan livescore-listener
```bash
npm start
# atau
node livescore-listener-wib.js
```

#### Step 2: Test endpoint di browser
```
http://localhost:6969/vmix-flat?id=1
```

Pastikan data muncul seperti ini:
```json
[
  {
    "court": "1",
    "status": "playing",
    "team1_player1_name": "Muhammad Rizky",
    "team1_player1_displayName": "Rizky",
    "team1_player1_club": "Jawa Tengah",
    "team1_displayName": "Rizky",
    "team1_serve": true,
    "team2_player1_name": "Akmal Fauzi",
    "team2_player1_displayName": "Akmal",
    "team2_player1_club": "Jawa Barat",
    "team2_displayName": "Akmal",
    "team2_serve": false,
    "team1_set1": 21,
    "team2_set1": 19,
    "team1_set2": 15,
    "team2_set2": 21,
    "team1_current": 11,
    "team2_current": 8
  }
]
```

#### Step 3: Buat Title di GT Title Designer
1. Buka **GT Title Designer**
2. Buat title baru atau edit existing
3. Tambahkan **Text fields** dengan data binding:

**Contoh Field Mapping (individu & beregu):**
```
Team 1 Name  → team1_displayName
Team 1 Club  → team1_player1_club
Team 2 Name  → team2_displayName
Team 2 Club  → team2_player1_club

Serve T1     → team1_serve   (true/false)
Serve T2     → team2_serve   (true/false)

Set 1 Score  → team1_set1 - team2_set1
Set 2 Score  → team1_set2 - team2_set2
Set 3 Score  → team1_set3 - team2_set3
Current      → team1_current - team2_current

Round        → round
Status       → status
```

**Tambahan khusus beregu:**
```
Jenis Partai → partai_label    (mis. "Ganda Putra")
Partai ke    → current_set
Skor Tie     → sets_won_team1 - sets_won_team2
```

#### Step 4: Add Web Input di vMix
1. **Add Input** → **Web Browser**
2. URL individu: `http://localhost:6969/vmix-flat?id=1`  
   URL beregu: `http://localhost:6969/vmix-flat-beregu?id=1`
3. Tick "**Reload every 1000ms**" (1 detik)
4. **OK**

#### Step 5: Link GT Title dengan Web Input
1. Pilih GT Title input
2. Klik **Data Source** button
3. Pilih **Web**
4. Select Web input yang sudah dibuat (step 4)
5. **OK**

✅ **Done!** Score akan auto-update setiap 1 detik!

---

### Method 2: Script (Advanced - Direct JSON)

#### Step 1: Add Script di vMix
```javascript
// vMix Script Example
var API = API;
var httpRequest = new XMLHttpRequest();

function updateScore() {
    httpRequest.open('GET', 'http://localhost:6969/vmix-flat?id=1', true);
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            // Response berupa array, ambil elemen pertama
            var data = JSON.parse(httpRequest.responseText)[0];

            // Update vMix Title fields
            API.Function('SetText', {
                Input: 'Scoreboard.gtzip',
                SelectedName: 'Team1Name.Text',
                Value: data.team1_displayName
            });

            API.Function('SetText', {
                Input: 'Scoreboard.gtzip',
                SelectedName: 'Team1Set1.Text',
                Value: data.team1_set1
            });

            // ... update field lainnya
        }
    };
    httpRequest.send();
}

// Update setiap 1 detik
setInterval(updateScore, 1000);
```

---

## 📝 Setup vMix - XML

### Step 1: Jalankan livescore-listener
```bash
npm start
```

### Step 2: Test XML endpoint
```
http://localhost:6969/vmix-xml?id=1
```

Akan menghasilkan XML seperti:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<match>
  <court>1</court>
  <status>playing</status>
  <tournament>TTA Divisi I</tournament>
  <round>R2</round>
  <match_number>39</match_number>

  <team1>
    <player1_name>Muhammad Rizky</player1_name>
    <player1_displayName>Rizky</player1_displayName>
    <player1_club>Jawa Tengah</player1_club>
    <player2_name></player2_name>
    <player2_displayName></player2_displayName>
    <player2_club></player2_club>
    <displayName>Rizky</displayName>
    <serve>true</serve>
  </team1>

  <team2>
    <player1_name>Akmal Fauzi</player1_name>
    <player1_displayName>Akmal</player1_displayName>
    <player1_club>Jawa Barat</player1_club>
    <player2_name></player2_name>
    <player2_displayName></player2_displayName>
    <player2_club></player2_club>
    <displayName>Akmal</displayName>
    <serve>false</serve>
  </team2>

  <scores>
    <team1_set1>21</team1_set1>
    <team2_set1>19</team2_set1>
    <team1_set2>0</team1_set2>
    <team2_set2>0</team2_set2>
    <team1_set3>0</team1_set3>
    <team2_set3>0</team2_set3>
    <team1_current>11</team1_current>
    <team2_current>8</team2_current>
  </scores>

  <metadata>
    <winner>0</winner>
    <retired>0</retired>
    <duration>45</duration>
    <last_update>16 Des 2025, 14:30:04 WIB</last_update>
    <update_time>14:30:04</update_time>
  </metadata>
</match>
```

Untuk **beregu** (`/vmix-xml-beregu?id=1`) strukturnya sama, dengan tambahan elemen
`<partai_type>`, `<partai_label>`, `<current_set>` di level atas dan
`<sets_won_team1>`, `<sets_won_team2>` di dalam `<scores>`.

### Step 3: Add Data Source di vMix
1. **Add Input** → **Data Source**
2. Type: **XML**
3. URL: `http://localhost:6969/vmix-xml?id=1` (atau `/vmix-xml-beregu?id=1`)
4. **Auto Update**: `1000` (1 detik)
5. **OK**

### Step 4: Create Title dan Bind Data
1. Buat GT Title
2. Add text fields
3. Right-click text → **Data Source**
4. Pilih XML data source
5. Navigate ke field (contoh: `match/team1/displayName`)
6. **OK**

✅ **Done!** vMix akan auto-fetch XML setiap 1 detik!

---

## 📊 Contoh Data

### Flat JSON Response Individu (`/vmix-flat?id=1`)
```json
[
  {
    "court": "1",
    "status": "playing",
    "tournament_name": "TTA Divisi I",
    "round": "R2",
    "match_number": "39",

    "team1_player1_name": "Muhammad Nashrulloh Al-Habsyi",
    "team1_player1_displayName": "Muhammad",
    "team1_player1_club": "Jawa Tengah",
    "team1_player2_name": "",
    "team1_player2_displayName": "",
    "team1_player2_club": "",
    "team1_displayName": "Muhammad",
    "team1_serve": true,

    "team2_player1_name": "Akmal Zaidan Pamuji",
    "team2_player1_displayName": "Akmal",
    "team2_player1_club": "Jawa Barat",
    "team2_player2_name": "",
    "team2_player2_displayName": "",
    "team2_player2_club": "",
    "team2_displayName": "Akmal",
    "team2_serve": false,

    "team1_set1": 21,
    "team2_set1": 19,
    "team1_set2": 18,
    "team2_set2": 21,
    "team1_set3": 11,
    "team2_set3": 8,

    "team1_current": 11,
    "team2_current": 8,

    "winner": 0,
    "retired": 0,
    "duration": 45,
    "last_update": "16 Des 2025, 14:30:04 WIB",
    "update_time": "14:30:04"
  }
]
```

### Flat JSON Response Beregu (`/vmix-flat-beregu?id=1`)
Field sama dengan individu, ditambah di bagian akhir:
```json
[
  {
    "court": "1",
    "status": "playing",
    "match_number": 2,
    "team1_player1_name": "Muhammad Rizky",
    "team1_player1_displayName": "Rizky",
    "team1_player1_club": "PB Djarum",
    "team1_player2_name": "Fauzan Akbar",
    "team1_player2_displayName": "Fauzan",
    "team1_player2_club": "PB Djarum",
    "team1_displayName": "Rizky / Fauzan",
    "team1_serve": true,

    "...": "(field skor, winner, duration, dst. sama dengan individu)",

    "partai_type": "MD",
    "partai_label": "Ganda Putra",
    "current_set": 2,
    "sets_won_team1": 1,
    "sets_won_team2": 0,
    "last_update": "16 Des 2025, 14:30:04 WIB",
    "update_time": "14:30:04"
  }
]
```

> Di beregu, `tournament_name` dan `round` selalu kosong (belum ada sumbernya di payload backend), dan `teamN_playerM_club` berisi nama klub tim.

---

## 🗺️ Field Mapping

`N` = `1` atau `2` (nomor tim), `M` = `1` atau `2` (pemain 1 atau 2 / partner ganda).

| Field vMix | JSON Field | Deskripsi |
|------------|-----------|-----------|
| **Lapangan** | `court` | Nomor lapangan (1-12) |
| **Status** | `status` | `waiting`, `on_court`, `playing`, `finished` |
| **Turnamen** | `tournament_name` | Nama turnamen/kategori (kosong di beregu) |
| **Round** | `round` | R1, R2, QF, SF, F, dll (kosong di beregu) |
| **Match #** | `match_number` | Nomor urut pertandingan (beregu: nomor partai) |
| | |
| **Team N Nama Lengkap** | `teamN_playerM_name` | Nama lengkap pemain M |
| **Team N Nama Pendek** | `teamN_playerM_displayName` | Nama pendek/tampil pemain M |
| **Team N Club** | `teamN_playerM_club` | Klub/daerah pemain M |
| **Team N Nama Tim** | `teamN_displayName` | Nama tampil tim; ganda digabung ` / ` |
| **Team N Serve** | `teamN_serve` | `true` jika tim N sedang serve |
| | |
| **Set M Team N** | `teamN_setM` | Score set M (1-3) tim N |
| **Current Team N** | `teamN_current` | Point game berjalan tim N |
| | |
| **Winner** | `winner` | ID pemenang (0 = belum selesai) |
| **Retired** | `retired` | Status retired |
| **Duration** | `duration` | Durasi pertandingan |
| **Last Update** | `last_update` | Timestamp lengkap WIB |
| **Update Time** | `update_time` | Jam saja (HH:MM:SS) |

**Khusus beregu:**

| Field vMix | JSON Field | Deskripsi |
|------------|-----------|-----------|
| **Kode Partai** | `partai_type` | Alias jenis partai (mis. `MD`) |
| **Jenis Partai** | `partai_label` | Nama jenis partai (mis. Ganda Putra) |
| **Partai/Set ke** | `current_set` | Set/partai yang sedang berjalan |
| **Set Menang T1** | `sets_won_team1` | Jumlah set yang dimenangkan tim 1 |
| **Set Menang T2** | `sets_won_team2` | Jumlah set yang dimenangkan tim 2 |

---

## 🔧 Troubleshooting

### ❌ Data tidak update
**Cek:**
1. Apakah `livescore-listener` jalan?
   ```bash
   curl http://localhost:6969/status
   ```

2. Apakah socket terkoneksi?
   ```bash
   curl http://localhost:6969/status
   # Cari: "connectionStatus": "connected"
   ```

3. Apakah ada events masuk?
   ```bash
   curl http://localhost:6969/events?limit=10
   ```

4. Apakah vMix auto-reload aktif?
   - Check Web Input settings → Reload interval
   - Recommended: 1000ms (1 detik)

### ❌ Field mapping tidak jalan
**Cek:**
1. Field name di GT Title harus **exact match**
2. Case-sensitive: `team1_displayName` ≠ `team1_displayname`
3. Test data dulu di browser sebelum integrate
4. Response `vmix-flat` berupa **array** — pastikan binding membaca elemen pertama

### ❌ Score lambat update
**Solusi:**
1. Kurangi reload interval ke 500ms atau 1000ms
2. Pastikan tidak ada network latency
3. Check CPU usage vMix (jangan terlalu tinggi)

### ❌ Error "Court not found"
**Cek:**
1. Apakah lapangan ada di `DAFTAR_LAPANGAN`?
   ```bash
   # .env
   DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8
   ```

2. Apakah sudah join room?
   ```bash
   curl http://localhost:6969/status
   # Cari: "joinedRooms": ["court_1", "court_2", ...]
   ```

### ❌ Error "Court not found (beregu)"
Court beregu baru dibuat setelah listener menerima event beregu pertama
(`addPoint` dengan `klasemen_uid`, atau event `liga*`). Mulai pertandingan di
wasit beregu dulu, lalu cek:
```bash
curl http://localhost:6969/debug-beregu?id=1
```
Jika `context` kosong, lihat log listener (`Beregu context fetch gagal`).

### ❌ Nama pemain/klub beregu kosong
Nama diambil dari *context* yang di-refresh saat event `liga*` (ganti partai/set), bukan tiap poin. Pastikan wasit sudah menekan PLAY / set partai, atau cek `lastContextFetch` di `/debug-beregu?id=N`.

### ❌ Indikator serve tidak berubah
Serve diambil dari data tiap poin (`addPoint`). Pastikan wasit sudah memilih server/receiver dan ada poin masuk (cek `/events?limit=10`).

---

## 🎨 Tips Desain Scoreboard

### Minimalis
```
┌──────────────────────────────┐
│  Muhammad (Jawa Tengah)      │
│  21 - 19  |  18 - 21  | 11-8 │
│                               │
│  Akmal (Jawa Barat)          │
└──────────────────────────────┘
```

### Professional
```
╔═══════════════════════════════════════╗
║  TTA DIVISI I - R2                    ║
║  Court 1                              ║
╠═══════════════════════════════════════╣
║                                       ║
║  🏸 Muhammad                          ║
║     Jawa Tengah                       ║
║                                       ║
║     21    18    11                    ║
║     ──    ──    ──                    ║
║     19    21     8                    ║
║                                       ║
║  🏸 Akmal                             ║
║     Jawa Barat                        ║
║                                       ║
╚═══════════════════════════════════════╝
```

### Indikator Serve
Gunakan `team1_serve` / `team2_serve` (boolean) untuk menampilkan ikon shuttlecock di sisi tim yang sedang serve, misalnya dengan visibility binding di GT Title.

### Highlight Winner
Gunakan conditional formatting di GT Title:
```javascript
// Pseudo-code
if (team1_set1 > team2_set1) {
    team1_set1_color = "green"
    team1_set1_bold = true
}
```

---

## 📝 Checklist Setup

- [ ] livescore-listener sudah running
- [ ] Test `/vmix-flat?id=1` (individu) atau `/vmix-flat-beregu?id=1` (beregu) di browser → data muncul
- [ ] vMix GT Title sudah dibuat dengan field yang sesuai
- [ ] Web Input sudah ditambahkan dengan URL yang benar
- [ ] Auto-reload 1000ms sudah aktif
- [ ] Data Source sudah di-link ke GT Title
- [ ] Test dengan pertandingan real → score dan serve update

---

## 🎯 Best Practices

1. **Polling Interval**: 1000ms (1 detik) - balance antara real-time dan CPU usage
2. **Backup**: Gunakan 2 lapangan (id=1 dan id=2) untuk seamless switch
3. **Error Handling**: Tampilkan "Waiting..." jika data kosong
4. **Preload**: Load GT Title sebelum pertandingan mulai
5. **Test**: Selalu test dengan data dummy sebelum live
6. **Beregu**: Ganti URL ke `-beregu` saat berpindah dari turnamen individu ke tim

---

## 📞 Support

Jika ada masalah:
1. Check console log dari `livescore-listener`
2. Check `/events` endpoint untuk melihat socket events
3. Check `/status` untuk connection status
4. Check `/debug?id=N` atau `/debug-beregu?id=N` untuk data internal court
5. Pastikan firewall tidak block port 6969

---

**Happy Streaming! 🎬🏸**
