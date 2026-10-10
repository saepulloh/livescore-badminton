# 🏸 Livescore Listener

Real-time badminton livescore socket listener dengan dukungan vMix integration untuk broadcast/streaming.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

- 🔌 **Socket Connection** - Koneksi real-time ke livescore server via Sails.io.js
- 🎯 **Multi-Court Support** - Monitor multiple courts simultaneously
- 🌐 **HTTP API** - RESTful endpoints untuk akses data
- 🎬 **vMix Ready** - Format flat JSON dan XML untuk vMix integration
- 👥 **Individu & Beregu** - Endpoint terpisah untuk pertandingan individu dan turnamen tim (beregu, 3x55)
- 🏸 **Indikator Serve** - Field `team1_serve` / `team2_serve` ter-update setiap poin
- 🕐 **WIB Timezone** - Timestamp dalam format WIB (GMT+7) yang readable
- 💾 **In-Memory Storage** - Tidak butuh database, data tersimpan di RAM
- ⚡ **Real-time Updates** - Score update otomatis setiap ada perubahan
- 🪟 **Windows Support** - One-click installer untuk Windows

---

## 🚀 Quick Start

### Windows (One-Click Install)

1. **Extract files** ke folder (e.g., `C:\livescore-listener\`)

2. **Run installer:**
   ```cmd
   install.bat
   ```
   Atau klik kanan → Run as Administrator

3. **Edit configuration** (optional):
   - Edit file `.env`
   - Set `LIVESCORE_HOST`, `DAFTAR_LAPANGAN`, `PORT`

4. **Start application:**
   ```cmd
   start.bat
   ```
   Atau double-click shortcut di desktop

5. **Open browser:**
   ```
   http://localhost:6969
   ```

✅ **Done!**

---

### Linux / macOS

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp env.example .env
   nano .env
   ```

3. **Run:**
   ```bash
   npm start
   # atau
   node livescore-listener-wib.js
   ```

4. **Open browser:** `http://localhost:6969`

---

## 📋 Requirements

- **Node.js** v16.0.0 or higher
- **npm** 7.0.0 or higher
- Access to livescore server (Sails.js based)

---

## ⚙️ Configuration

Edit file `.env`:

```env
# Livescore host URL
LIVESCORE_HOST=http://localhost:1337

# Daftar lapangan (comma separated)
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12

# HTTP Server Port
PORT=6969
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LIVESCORE_HOST` | `http://localhost:1337` | URL livescore server |
| `DAFTAR_LAPANGAN` | `1,2,3,4,5,6,7,8,9,10,11,12` | Nomor lapangan yang dimonitor |
| `PORT` | `6969` | HTTP server port |

---

## 🌐 API Endpoints

### For vMix (Recommended)

Operator memilih URL sesuai jenis turnamen:

| Jenis | JSON (recommended) ⭐ | XML |
|-------|----------------------|-----|
| **Individu** | `/vmix-flat?id=N` | `/vmix-xml?id=N` |
| **Beregu** (turnamen tim) | `/vmix-flat-beregu?id=N` | `/vmix-xml-beregu?id=N` |

Response JSON dibungkus dalam array (`[ {...} ]`).

#### `/vmix-flat?id=N` ⭐ (Individu)
Flat JSON format untuk vMix GT Title Designer
```bash
curl http://localhost:6969/vmix-flat?id=1
```

**Response:**
```json
[
  {
    "court": "1",
    "status": "playing",
    "tournament_name": "TTA Divisi I",
    "round": "R2",
    "match_number": 12,
    "team1_player1_name": "Muhammad Rizky",
    "team1_player1_displayName": "Rizky",
    "team1_player1_club": "Jawa Tengah",
    "team1_player2_name": "",
    "team1_player2_displayName": "",
    "team1_player2_club": "",
    "team1_displayName": "Rizky",
    "team1_serve": true,
    "team2_player1_name": "Akmal Fauzi",
    "team2_player1_displayName": "Akmal",
    "team2_player1_club": "Jawa Barat",
    "team2_displayName": "Akmal",
    "team2_serve": false,
    "team1_set1": 21,
    "team2_set1": 19,
    "team1_set2": 0,
    "team2_set2": 0,
    "team1_set3": 0,
    "team2_set3": 0,
    "team1_current": 11,
    "team2_current": 8,
    "winner": 0,
    "retired": 0,
    "duration": 1234,
    "last_update": "16 Des 2025, 14:30:04 WIB",
    "update_time": "14:30:04"
  }
]
```

> Untuk ganda, `player2_*` terisi dan `teamN_displayName` digabung dengan ` / `
> (contoh: `"Rizky / Fauzan"`).

---

#### `/vmix-xml?id=N` (Individu)
XML format untuk vMix Data Source
```bash
curl http://localhost:6969/vmix-xml?id=1
```

**Response:**
```xml
<match>
  <court>1</court>
  <status>playing</status>
  <tournament>TTA Divisi I</tournament>
  <round>R2</round>
  <match_number>12</match_number>
  <team1>
    <player1_name>Muhammad Rizky</player1_name>
    <player1_displayName>Rizky</player1_displayName>
    <player1_club>Jawa Tengah</player1_club>
    <displayName>Rizky</displayName>
    <serve>true</serve>
  </team1>
  <team2>...</team2>
  <scores>
    <team1_set1>21</team1_set1>
    <team2_set1>19</team2_set1>
    <team1_current>11</team1_current>
    <team2_current>8</team2_current>
  </scores>
  <metadata>
    <winner>0</winner>
    <retired>0</retired>
    <duration>1234</duration>
    <last_update>16 Des 2025, 14:30:04 WIB</last_update>
    <update_time>14:30:04</update_time>
  </metadata>
</match>
```

---

#### `/vmix-flat-beregu?id=N` ⭐ (Beregu)
Flat JSON untuk turnamen tim (beregu). Field sama dengan individu, ditambah
field khusus beregu (lihat tabel di bawah).
```bash
curl http://localhost:6969/vmix-flat-beregu?id=1
```

Court yang belum pernah menerima event beregu mengembalikan `404`
(`Court not found (beregu)`). Court beregu yang sedang idle tetap
mengembalikan `200` dengan nilai default.

#### `/vmix-xml-beregu?id=N` (Beregu)
XML untuk turnamen tim; struktur sama dengan `/vmix-xml` ditambah
`<partai_type>`, `<partai_label>`, `<current_set>`, `<sets_won_team1>` dan
`<sets_won_team2>`.

---

### General Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/status` | GET | Connection status |
| `/listpertandingan` | GET | All matches dari semua lapangan (individu) |
| `/lapangan?id=N` | GET | Data lapangan tertentu (full, individu) |
| `/vmix?id=N` | GET | Data match nested (individu) |
| `/events?limit=N` | GET | Event history (default 100 terakhir) |
| `/debug?id=N` | GET | Debug struktur data internal (individu) |
| `/debug-beregu?id=N` | GET | Debug struktur data internal (beregu) |
| `/clear` | GET | Clear all stored data (individu & beregu) |

---

## 📊 Response Format

### Flat JSON (`/vmix-flat` & `/vmix-flat-beregu`)

**Field Mapping untuk vMix:**

| Field | Description | Example |
|-------|-------------|---------|
| `court` | Nomor lapangan | `"1"` |
| `status` | Status match | `"waiting"`, `"on_court"`, `"playing"`, `"finished"` |
| `tournament_name` | Nama turnamen (kosong di beregu) | `"TTA Divisi I"` |
| `round` | Round (kosong di beregu) | `"R2"`, `"QF"`, `"SF"`, `"F"` |
| `match_number` | Nomor match (beregu: nomor partai) | `12` |
| `teamN_player1_name` | Nama lengkap pemain 1 | `"Muhammad Rizky"` |
| `teamN_player1_displayName` | Nama pendek pemain 1 | `"Rizky"` |
| `teamN_player1_club` | Klub pemain 1 | `"Jawa Tengah"` |
| `teamN_player2_name` / `_displayName` / `_club` | Pemain 2 (ganda) | `"Fauzan"` |
| `teamN_displayName` | Nama tampil tim (ganda digabung ` / `) | `"Rizky / Fauzan"` |
| `team1_serve` / `team2_serve` | Tim yang sedang serve (boolean) | `true` |
| `teamN_setM` | Skor set M (M = 1-3) | `21` |
| `team1_current` / `team2_current` | Poin game berjalan | `11` / `8` |
| `winner` | Pemenang (0 = belum ada) | `0` |
| `retired` | Status retired | `0` |
| `duration` | Durasi match | `1234` |
| `last_update` | Timestamp lengkap WIB | `"16 Des 2025, 14:30:04 WIB"` |
| `update_time` | Jam saja (compact) | `"14:30:04"` |

> `N` = `1` atau `2` (nomor tim).

**Field tambahan khusus beregu** (`/vmix-flat-beregu`):

| Field | Description | Example |
|-------|-------------|---------|
| `partai_type` | Alias jenis partai | `"MD"` |
| `partai_label` | Nama jenis partai | `"Ganda Putra"` |
| `current_set` | Set/partai ke berapa yang berjalan | `2` |
| `sets_won_team1` / `sets_won_team2` | Jumlah set yang sudah dimenangkan | `1` / `0` |

Di beregu, nama klub (`teamN_playerM_club`) diisi dengan nama klub tim.

---

## 🔄 Alur Data

**Individu**
- `playgame` / `play` → data match + reset skor untuk match baru
- `addPoint` / `updatescore` / `updateScore` → skor real-time & serve
- `clearLapangan` → status `finished`, skor akhir disimpan

**Beregu** (disimpan terpisah dari individu, hanya untuk court yang pernah menerima tie beregu)
- `addPoint` dengan `klasemen_uid` → skor & serve real-time, **tanpa fetch**
- `ligaPlay`, `ligaSetpartai`, `ligaClearCourt`, `ligaLineupUpdated`, `ligaScoreUpdate`
  → hanya sinyal untuk refresh *context* (nama klub/pemain, jenis partai)
  lewat `/ligatie/joinRoomWasit`, di-debounce 800 ms per court

---

## 🎬 vMix Integration

### Quick Setup

1. **Start livescore-listener:**
   ```cmd
   start.bat
   ```

2. **Add Web Input di vMix:**
   - Add Input → Web Browser
   - URL individu: `http://localhost:6969/vmix-flat?id=1`
   - URL beregu: `http://localhost:6969/vmix-flat-beregu?id=1`
   - Check "Reload every 1000ms" (1 second)

3. **Create GT Title:**
   - Add text fields
   - Data binding: `team1_displayName`, `team1_set1`, `team1_current`, etc.

4. **Link Data Source:**
   - Select GT Title
   - Data Source → Web
   - Select Web input (step 2)

✅ **Done!** Score auto-update every 1 second!

**Full guide:** See [Dokumentasi/VMIX-SETUP.md](Dokumentasi/VMIX-SETUP.md)

---

## 🔧 Advanced Usage

### Using PM2 (Process Manager)

**Install PM2:**
```bash
npm install -g pm2
npm install -g pm2-windows-startup  # Windows only
```

**Start as service:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2-startup install  # Windows
```

**Commands:**
```bash
pm2 start livescore-listener      # Start
pm2 stop livescore-listener       # Stop
pm2 restart livescore-listener    # Restart
pm2 logs livescore-listener       # View logs
pm2 monit                         # Monitor
```

---

### Docker (Coming Soon)

```bash
docker build -t livescore-listener .
docker run -p 6969:6969 --env-file .env livescore-listener
```

---

## 📁 Project Structure

```
livescore-listener/
│
├── livescore-listener-wib.js     # Main application (individu + beregu)
├── debug-socket.js                # Debug koneksi socket
├── test-connection.js             # Test koneksi (npm test)
├── package.json                   # Dependencies
├── env.example                    # Template konfigurasi
├── .env                           # Configuration (salinan env.example)
│
├── install.bat                    # Windows installer
│   └── (generate) start.bat, stop.bat, status.bat, test.bat,
│       ecosystem.config.js (PM2)
│
├── README.md                      # This file
└── Dokumentasi/
    ├── INSTALL-WINDOWS.md         # Windows installation guide
    ├── VMIX-SETUP.md              # vMix integration guide
    ├── GIT-INSTALLATION.md        # Git installation guide
    └── PACKAGE-SUMMARY.md         # Package summary
```

---

## 🐛 Troubleshooting

### Application not starting

**Check Node.js:**
```bash
node --version  # Should be v16+
npm --version
```

**Reinstall dependencies:**
```bash
npm install
```

---

### Port already in use

**Windows:**
```cmd
netstat -ano | findstr :6969
taskkill /PID <PID> /F
```

**Linux/macOS:**
```bash
lsof -i :6969
kill -9 <PID>
```

Or change port in `.env`:
```env
PORT=7000
```

---

### Cannot connect to livescore server

**Check configuration:**
```bash
curl http://your-livescore-server:1337
```

**Test connection:**
```bash
curl http://localhost:6969/status
```

**Check logs:**
```bash
# View console output
node livescore-listener-wib.js

# Or with PM2
pm2 logs livescore-listener
```

---

### Data not updating

**Check socket events:**
```bash
curl http://localhost:6969/events?limit=20
```

**Check lapangan data:**
```bash
curl http://localhost:6969/lapangan?id=1
```

**Restart application:**
```bash
stop.bat
start.bat
```

---

### Endpoint beregu 404 (`Court not found (beregu)`)

Court beregu baru dibuat setelah menerima event beregu pertama
(`addPoint` dengan `klasemen_uid` atau event `liga*`). Mulai pertandingan
di wasit beregu dulu, lalu cek:
```bash
curl http://localhost:6969/debug-beregu?id=1
```

Jika `context` kosong, cek log `Beregu context fetch gagal` — artinya
`/ligatie/joinRoomWasit` tidak bisa diakses dari listener.

**Full guide:** See [Dokumentasi/INSTALL-WINDOWS.md](Dokumentasi/INSTALL-WINDOWS.md) → Troubleshooting section

---

## 📖 Documentation

- **[INSTALL-WINDOWS.md](Dokumentasi/INSTALL-WINDOWS.md)** - Panduan instalasi lengkap untuk Windows
- **[VMIX-SETUP.md](Dokumentasi/VMIX-SETUP.md)** - Setup vMix integration step-by-step
- **[GIT-INSTALLATION.md](Dokumentasi/GIT-INSTALLATION.md)** - Panduan instalasi Git
- **[PACKAGE-SUMMARY.md](Dokumentasi/PACKAGE-SUMMARY.md)** - Ringkasan paket

---

## 🔄 Updates

### Version 1.0.0 (Current)
- ✅ Socket connection via Sails.io.js
- ✅ Multi-court support
- ✅ HTTP API endpoints
- ✅ vMix flat JSON format (`/vmix-flat`)
- ✅ vMix XML format (`/vmix-xml`)
- ✅ Dukungan beregu: `/vmix-flat-beregu`, `/vmix-xml-beregu`, `/debug-beregu`
- ✅ Field `team1_serve` / `team2_serve` (update tiap poin, individu & beregu)
- ✅ Field `teamN_playerM_displayName` dan `teamN_displayName`
- ✅ WIB timezone support
- ✅ Windows one-click installer
- ✅ PM2 support
- ✅ Desktop shortcuts
- ✅ Comprehensive documentation

---

## 📝 License

MIT License - feel free to use in your projects!

---

## 👨‍💻 Author

**Saepulloh**

---

## 🙏 Acknowledgments

- Built with Node.js
- Uses Sails.io.js for socket connectivity
- vMix integration support

---

## 🎯 Use Cases

- 🎬 **Streaming/Broadcasting** - Live score overlay untuk streaming badminton
- 📺 **TV Production** - Real-time scoreboard untuk broadcast TV
- 🖥️ **LED Display** - Score display untuk venue
- 📱 **Mobile Apps** - Data source untuk mobile scoreboard apps
- 🌐 **Web Dashboard** - Live match tracking

---

## ⚡ Performance

- **Memory Usage:** ~50-100 MB
- **CPU Usage:** < 1% (idle), ~5% (active)
- **Response Time:** < 50ms
- **Max Courts:** Unlimited (tested with 12 courts)
- **Concurrent Requests:** 100+ requests/second

---

## 🔐 Security Notes

- No authentication by default (LAN use)
- For production: Use reverse proxy (nginx)
- For internet: Add authentication layer
- Keep .env file secure (add to .gitignore)

---

## 🚧 Roadmap

- [ ] Docker support
- [ ] Authentication/Authorization
- [ ] WebSocket for real-time push
- [ ] Database backup option
- [ ] Match history
- [ ] Statistics dashboard
- [ ] Multi-language support
- [ ] Mobile-friendly web UI

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/livescore-listener/issues)
- **Documentation:** See docs folder
- **Questions:** Check `INSTALL-WINDOWS.md` troubleshooting section

---

**Ready to stream badminton matches with live scores! 🏸🎬**
