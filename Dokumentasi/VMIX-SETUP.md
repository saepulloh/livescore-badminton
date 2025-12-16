# 🎬 vMix Integration Guide

Panduan lengkap untuk mengintegrasikan livescore-listener dengan vMix untuk menampilkan scoreboard badminton secara real-time.

---

## 📋 Daftar Isi
- [Endpoint yang Tersedia](#endpoint-yang-tersedia)
- [Setup vMix - Flat JSON](#setup-vmix---flat-json-recommended)
- [Setup vMix - XML](#setup-vmix---xml)
- [Contoh Data](#contoh-data)
- [Field Mapping](#field-mapping)
- [Troubleshooting](#troubleshooting)

---

## 🔗 Endpoint yang Tersedia

### 1. `/vmix-flat?id=N` ⭐ **RECOMMENDED**
Format: **Flat JSON**  
Cocok untuk: **GT Title Designer** atau **Web input**

**URL Example:**
```
http://localhost:6969/vmix-flat?id=1
```

**Keuntungan:**
- ✅ Struktur flat, mudah di-mapping
- ✅ Field names simple tanpa nested object
- ✅ Auto-update saat ada score baru
- ✅ Format JSON standar

---

### 2. `/vmix-xml?id=N`
Format: **XML**  
Cocok untuk: **Data Source (XML)**

**URL Example:**
```
http://localhost:6969/vmix-xml?id=1
```

**Keuntungan:**
- ✅ Native vMix XML support
- ✅ Easy drag-and-drop mapping
- ✅ Struktur hierarchical yang jelas

---

## 🚀 Setup vMix - Flat JSON (Recommended)

### Method 1: GT Title Designer + Web Input

#### Step 1: Jalankan livescore-listener
```bash
node livescore-listener-fixed.js
```

#### Step 2: Test endpoint di browser
```
http://localhost:6969/vmix-flat?id=1
```

Pastikan data muncul seperti ini:
```json
{
  "court": "1",
  "status": "playing",
  "team1_name": "Muhammad",
  "team1_club": "Jawa Tengah",
  "team2_name": "Akmal",
  "team2_club": "Jawa Barat",
  "team1_set1": 21,
  "team2_set1": 19,
  "team1_set2": 15,
  "team2_set2": 21,
  "team1_current": 11,
  "team2_current": 8
}
```

#### Step 3: Buat Title di GT Title Designer
1. Buka **GT Title Designer**
2. Buat title baru atau edit existing
3. Tambahkan **Text fields** dengan data binding:

**Contoh Field Mapping:**
```
Team 1 Name  → {{team1_name}}
Team 1 Club  → {{team1_club}}
Team 2 Name  → {{team2_name}}
Team 2 Club  → {{team2_club}}

Set 1 Score  → {{team1_set1}} - {{team2_set1}}
Set 2 Score  → {{team1_set2}} - {{team2_set2}}
Current      → {{team1_current}} - {{team2_current}}

Round        → {{round}}
Status       → {{status}}
```

#### Step 4: Add Web Input di vMix
1. **Add Input** → **Web Browser**
2. URL: `http://localhost:6969/vmix-flat?id=1`
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
            var data = JSON.parse(httpRequest.responseText);
            
            // Update vMix Title fields
            API.Function('SetText', {
                Input: 'Scoreboard.gtzip',
                SelectedName: 'Team1Name.Text',
                Value: data.team1_name
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
node livescore-listener-fixed.js
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
  
  <team1>
    <n>Muhammad</n>
    <club>Jawa Tengah</club>
  </team1>
  
  <team2>
    <n>Akmal</n>
    <club>Jawa Barat</club>
  </team2>
  
  <scores>
    <team1_set1>21</team1_set1>
    <team2_set1>19</team2_set1>
    <team1_current>11</team1_current>
    <team2_current>8</team2_current>
  </scores>
</match>
```

### Step 3: Add Data Source di vMix
1. **Add Input** → **Data Source**
2. Type: **XML**
3. URL: `http://localhost:6969/vmix-xml?id=1`
4. **Auto Update**: `1000` (1 detik)
5. **OK**

### Step 4: Create Title dan Bind Data
1. Buat GT Title
2. Add text fields
3. Right-click text → **Data Source**
4. Pilih XML data source
5. Navigate ke field (contoh: `match/team1/n`)
6. **OK**

✅ **Done!** vMix akan auto-fetch XML setiap 1 detik!

---

## 📊 Contoh Data

### Flat JSON Response (`/vmix-flat?id=1`)
```json
{
  "court": "1",
  "status": "playing",
  "tournament_name": "TTA Divisi I",
  "round": "R2",
  "match_number": "39",
  
  "team1_name": "Muhammad",
  "team1_firstname": "",
  "team1_lastname": "Muhammad Nashrulloh Al-Habsyi",
  "team1_club": "Jawa Tengah",
  "team1_player2_name": "",
  
  "team2_name": "Akmal",
  "team2_firstname": "",
  "team2_lastname": "Akmal Zaidan Pamuji",
  "team2_club": "Jawa Barat",
  "team2_player2_name": "",
  
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
  "last_update": "2025-12-16T07:30:04.470Z"
}
```

---

## 🗺️ Field Mapping

| Field vMix | JSON Field | Deskripsi |
|------------|-----------|-----------|
| **Lapangan** | `court` | Nomor lapangan (1-12) |
| **Status** | `status` | `playing`, `on_court`, `finished`, `waiting` |
| **Turnamen** | `tournament_name` | Nama turnamen/kategori |
| **Round** | `round` | R1, R2, QF, SF, F, dll |
| **Match #** | `match_number` | Nomor urut pertandingan |
| | |
| **Team 1 Nama** | `team1_name` | Nama pemain 1 (display name) |
| **Team 1 Nama Lengkap** | `team1_lastname` | Nama lengkap pemain 1 |
| **Team 1 Club** | `team1_club` | Klub/daerah pemain 1 |
| **Team 1 Partner** | `team1_player2_name` | Partner (untuk ganda) |
| | |
| **Team 2 Nama** | `team2_name` | Nama pemain 2 |
| **Team 2 Club** | `team2_club` | Klub/daerah pemain 2 |
| | |
| **Set 1 Team1** | `team1_set1` | Score set 1 team 1 |
| **Set 1 Team2** | `team2_set1` | Score set 1 team 2 |
| **Set 2 Team1** | `team1_set2` | Score set 2 team 1 |
| **Set 2 Team2** | `team2_set2` | Score set 2 team 2 |
| **Set 3 Team1** | `team1_set3` | Score set 3 team 1 |
| **Set 3 Team2** | `team2_set3` | Score set 3 team 2 |
| | |
| **Current Team1** | `team1_current` | Point saat ini team 1 |
| **Current Team2** | `team2_current` | Point saat ini team 2 |
| | |
| **Winner** | `winner` | ID pemenang (0 = belum selesai) |
| **Duration** | `duration` | Durasi pertandingan (menit) |
| **Last Update** | `last_update` | Timestamp update terakhir |

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
2. Case-sensitive: `team1_name` ≠ `Team1_Name`
3. Test data dulu di browser sebelum integrate

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
- [ ] Test `/vmix-flat?id=1` di browser → data muncul
- [ ] vMix GT Title sudah dibuat dengan field yang sesuai
- [ ] Web Input sudah ditambahkan dengan URL yang benar
- [ ] Auto-reload 1000ms sudah aktif
- [ ] Data Source sudah di-link ke GT Title
- [ ] Test dengan pertandingan real → score update

---

## 🎯 Best Practices

1. **Polling Interval**: 1000ms (1 detik) - balance antara real-time dan CPU usage
2. **Backup**: Gunakan 2 lapangan (id=1 dan id=2) untuk seamless switch
3. **Error Handling**: Tampilkan "Waiting..." jika data kosong
4. **Preload**: Load GT Title sebelum pertandingan mulai
5. **Test**: Selalu test dengan data dummy sebelum live

---

## 📞 Support

Jika ada masalah:
1. Check console log dari `livescore-listener`
2. Check `/events` endpoint untuk melihat socket events
3. Check `/status` untuk connection status
4. Pastikan firewall tidak block port 6969

---

**Happy Streaming! 🎬🏸**
