# 🏸 Livescore Listener

Real-time badminton livescore socket listener with vMix integration for broadcast/streaming.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

- 🎯 **Multi-Court Support** - Monitor multiple courts simultaneously
- 🌐 **HTTP API** - RESTful endpoints for data access
- 🎬 **vMix Ready** - Flat JSON and XML formats for vMix integration
- 👥 **Singles/Doubles (individu) & Team Event (beregu)** - Separate endpoints for singles/doubles matches and team tournaments (team event / beregu, 3x55)
- 🏸 **Serve Indicator** - The `team1_serve` / `team2_serve` fields are updated on every point
- 🕐 **WIB Timezone** - Timestamps in a readable WIB (GMT+7) format
- 💾 **In-Memory Storage** - No database needed, data is kept in RAM
- ⚡ **Real-time Updates** - Scores update automatically on every change
- 🪟 **Windows Support** - One-click installer for Windows

---

## 🚀 Quick Start

### Windows (One-Click Install)

1. **Extract files** to a folder (e.g., `C:\livescore-listener\`)

2. **Run installer:**
   ```cmd
   install.bat
   ```
   Or right-click → Run as Administrator

3. **Edit configuration** (optional):
   - Edit the `.env` file
   - Set `LIVESCORE_HOST`, `DAFTAR_LAPANGAN`, `PORT`

4. **Start application:**
   ```cmd
   start.bat
   ```
   Or double-click the desktop shortcut

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
   # or
   node livescore-listener-wib.js
   ```

4. **Open browser:** `http://localhost:6969`

---

## 📋 Requirements

- **Node.js** v20.0.0 or higher
- **npm** 7.0.0 or higher
- Access to livescore server (Sails.js based)

---

## ⚙️ Configuration

Edit the `.env` file:

```env
# Livescore host URL
LIVESCORE_HOST=http://localhost:1337

# List of courts (comma separated)
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12

# HTTP Server Port
PORT=6969
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LIVESCORE_HOST` | `http://localhost:1337` | Livescore server URL |
| `DAFTAR_LAPANGAN` | `1,2,3,4,5,6,7,8,9,10,11,12` | List of court numbers to monitor |
| `PORT` | `6969` | HTTP server port |

---

## 🌐 API Endpoints

### For vMix (Recommended)

The operator picks the URL according to the tournament type:

| Type | JSON (recommended) ⭐ | XML |
|-------|----------------------|-----|
| **Singles/Doubles (individu)** | `/vmix-flat?id=N` | `/vmix-xml?id=N` |
| **Team event (beregu)** (team tournament) | `/vmix-flat-beregu?id=N` | `/vmix-xml-beregu?id=N` |

JSON responses are wrapped in an array (`[ {...} ]`).

#### `/vmix-flat?id=N` ⭐ (Singles/Doubles, individu)
Flat JSON format for the vMix GT Title Designer
```bash
curl http://localhost:6969/vmix-flat?id=1
```

**Response:**
```json
[
  {
    "court": "1",
    "status": "on_court",
    "tournament_name": "XD",
    "round": "R1",
    "match_number": 2,
    "team1_player1_name": "Kleopas Binar Putra Prakoso",
    "team1_player1_displayName": "Prakoso",
    "team1_player1_club": "INA",
    "team1_player2_name": "Meisa Rizka Fitria",
    "team1_player2_displayName": "Fitria",
    "team1_player2_club": "INA",
    "team1_displayName": "Prakoso / Fitria",
    "team1_serve": true,
    "team2_player1_name": "Julius Villabrille",
    "team2_player1_displayName": "Villabrille",
    "team2_player1_club": "PHI",
    "team2_player2_name": "Hernandez Andrea Princess",
    "team2_player2_displayName": "Hernandez",
    "team2_player2_club": "PHI",
    "team2_displayName": "Villabrille / Hernandez",
    "team2_serve": false,
    "team1_set1": 21,
    "team2_set1": 19,
    "team1_set2": 18,
    "team2_set2": 21,
    "team1_set3": 21,
    "team2_set3": 14,
    "team1_current": 0,
    "team2_current": 0,
    "winner": 1,
    "retired": 0,
    "duration": 45,
    "last_update": "10 Okt 2026, 15:33:58 WIB",
    "update_time": "15:34:04"
  }
]
```

> For doubles, `player2_*` is filled in and `teamN_displayName` is joined with ` / `
> (example: `"Prakoso / Fitria"`).

---

#### `/vmix-xml?id=N` (Singles/Doubles, individu)
XML format for the vMix Data Source
```bash
curl http://localhost:6969/vmix-xml?id=1
```

**Response:**
```xml
<match>
  <court>1</court>
  <status>on_court</status>
  <tournament>XD</tournament>
  <round>R1</round>
  <match_number>2</match_number>
  <team1>
    <player1_name>Kleopas Binar Putra Prakoso</player1_name>
    <player1_displayName>Prakoso</player1_displayName>
    <player1_club>INA</player1_club>
    <displayName>Prakoso / Fitria</displayName>
    <serve>true</serve>
  </team1>
  <team2>...</team2>
  <scores>
    <team1_set1>21</team1_set1>
    <team2_set1>19</team2_set1>
    <team1_current>0</team1_current>
    <team2_current>0</team2_current>
  </scores>
  <metadata>
    <winner>1</winner>
    <retired>0</retired>
    <duration>45</duration>
    <last_update>10 Okt 2026, 15:33:58 WIB</last_update>
    <update_time>15:34:04</update_time>
  </metadata>
</match>
```

---

#### `/vmix-flat-beregu?id=N` ⭐ (Team event, beregu)
Flat JSON for team tournaments (team event / beregu). The fields are the same as
for singles/doubles (individu), plus the team-event-specific fields (see the table below).
```bash
curl http://localhost:6969/vmix-flat-beregu?id=1
```

A court that has never received a team event (beregu) event returns `404`
(`Court not found (beregu)`). An idle team event court still
returns `200` with default values.

#### `/vmix-xml-beregu?id=N` (Team event, beregu)
XML for team tournaments; the structure is the same as `/vmix-xml` plus
`<partai_type>`, `<partai_label>`, `<current_set>`, `<sets_won_team1>` and
`<sets_won_team2>`.

---

### Test Mode (`&test=true`)

Add `&test=true` to any vMix endpoint to get **dummy data** (a doubles match
with names, clubs, scores and serve), even when no match has been received yet.
This lets the vMix operator build and test a GT Title offline.

```bash
curl "http://localhost:6969/vmix-flat?id=1&test=true"
curl "http://localhost:6969/vmix-xml?id=1&test=true"
curl "http://localhost:6969/vmix-flat-beregu?id=1&test=true"
curl "http://localhost:6969/vmix-xml-beregu?id=1&test=true"
```

- Same fields as real data, so bindings made in test mode keep working live.
- Works for any `id`, even a court that has no data (no 404).
- Remove `&test=true` from the vMix URL before going live.

---

### General Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/status` | GET | Connection status |
| `/listpertandingan` | GET | All matches from all courts (individual, individu) |
| `/lapangan?id=N` | GET | Data for a specific court (full, individual) |
| `/vmix?id=N` | GET | Nested match data (individual) |
| `/events?limit=N` | GET | Event history (default: last 100) |
| `/debug?id=N` | GET | Debug internal data structure (individual) |
| `/debug-beregu?id=N` | GET | Debug internal data structure (team event, beregu) |
| `/clear` | GET | Clear all stored data (individual & team event) |

---

## 📊 Response Format

### Flat JSON (`/vmix-flat` & `/vmix-flat-beregu`)

**Field Mapping for vMix:**

| Field | Description | Example |
|-------|-------------|---------|
| `court` | Court number | `"1"` |
| `status` | Match status | `"waiting"`, `"on_court"`, `"playing"`, `"finished"` |
| `tournament_name` | Tournament name (empty in team event) | `"XD"` |
| `round` | Round (empty in team event) | `"R2"`, `"QF"`, `"SF"`, `"F"` |
| `match_number` | Match number (team event: partai number) | `12` |
| `teamN_player1_name` | Full name of player 1 | `"Kleopas Binar Putra Prakoso"` |
| `teamN_player1_displayName` | Short name of player 1 | `"Prakoso"` |
| `teamN_player1_club` | Club of player 1 | `"INA"` |
| `teamN_player2_name` / `_displayName` / `_club` | Player 2 (doubles) | `"Fitria"` |
| `teamN_displayName` | Team display name (doubles joined with ` / `) | `"Prakoso / Fitria"` |
| `team1_serve` / `team2_serve` | Team currently serving (boolean) | `true` |
| `teamN_setM` | Score of set M (M = 1-3) | `21` |
| `team1_current` / `team2_current` | Points in the current game | `11` / `8` |
| `winner` | Winner (0 = none yet) | `0` |
| `retired` | Retired status | `0` |
| `duration` | Match duration | `1234` |
| `last_update` | Full WIB timestamp | `"16 Des 2025, 14:30:04 WIB"` |
| `update_time` | Time only (compact) | `"14:30:04"` |

> `N` = `1` or `2` (team number).

**Additional team-event-specific fields** (`/vmix-flat-beregu`):

| Field | Description | Example |
|-------|-------------|---------|
| `partai_type` | Match type alias | `"XD"` |
| `partai_label` | Match type name | `"Mixed Doubles"` |
| `current_set` | Which set/partai is in progress | `2` |
| `sets_won_team1` / `sets_won_team2` | Number of sets already won | `1` / `0` |

In team event (beregu), the club name (`teamN_playerM_club`) is filled with the team's club name.

---

## 🔄 Data Flow

**Singles/Doubles (individu)**
- `playgame` / `play` → match data + score reset for a new match
- `addPoint` / `updatescore` / `updateScore` → real-time score & serve
- `clearLapangan` → status `finished`, final score is kept

**Team event (beregu)** (stored separately from individual, only for courts that have received a team event tie)
- `addPoint` with `klasemen_uid` → real-time score & serve, **without fetch**
- `ligaPlay`, `ligaSetpartai`, `ligaClearCourt`, `ligaLineupUpdated`, `ligaScoreUpdate`
  → only signals to refresh the *context* (club/player names, match type)
  via `/ligatie/joinRoomWasit`, debounced 800 ms per court

---

## 🎬 vMix Integration

### Quick Setup

1. **Start livescore-listener:**
   ```cmd
   start.bat
   ```

2. **Add Web Input in vMix:**
   - Add Input → Web Browser
   - Singles/doubles (individu) URL: `http://localhost:6969/vmix-flat?id=1`
   - Team event (beregu) URL: `http://localhost:6969/vmix-flat-beregu?id=1`
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
├── livescore-listener-wib.js     # Main application (individual + team event)
├── debug-socket.js                # Socket connection debugging
├── test-connection.js             # Connection test (npm test)
├── package.json                   # Dependencies
├── env.example                    # Configuration template
├── .env                           # Configuration (copy of env.example)
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
node --version  # Should be v20+
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

**Check court data:**
```bash
curl http://localhost:6969/lapangan?id=1
```

**Restart application:**
```bash
stop.bat
start.bat
```

---

### Team event (beregu) endpoint 404 (`Court not found (beregu)`)

A team event (beregu) court is only created after receiving the first team event
event (`addPoint` with `klasemen_uid` or a `liga*` event). Start a match
in the team event (beregu) referee app (wasit) first, then check:
```bash
curl http://localhost:6969/debug-beregu?id=1
```

If `context` is empty, check the log `Beregu context fetch failed` — it means
`/ligatie/joinRoomWasit` cannot be reached from the listener.

**Full guide:** See [Dokumentasi/INSTALL-WINDOWS.md](Dokumentasi/INSTALL-WINDOWS.md) → Troubleshooting section

---

## 📖 Documentation

- **[INSTALL-WINDOWS.md](Dokumentasi/INSTALL-WINDOWS.md)** - Complete installation guide for Windows
- **[VMIX-SETUP.md](Dokumentasi/VMIX-SETUP.md)** - Step-by-step vMix integration setup
- **[GIT-INSTALLATION.md](Dokumentasi/GIT-INSTALLATION.md)** - Git installation guide
- **[PACKAGE-SUMMARY.md](Dokumentasi/PACKAGE-SUMMARY.md)** - Package summary

---

## 🔄 Updates

### Version 1.0.0 (Current)
- ✅ Socket connection via Sails.io.js
- ✅ Multi-court support
- ✅ HTTP API endpoints
- ✅ vMix flat JSON format (`/vmix-flat`)
- ✅ vMix XML format (`/vmix-xml`)
- ✅ Team event (beregu) support: `/vmix-flat-beregu`, `/vmix-xml-beregu`, `/debug-beregu`
- ✅ `team1_serve` / `team2_serve` fields (updated every point, individual & team event)
- ✅ `teamN_playerM_displayName` and `teamN_displayName` fields
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

- 🎬 **Streaming/Broadcasting** - Live score overlay for badminton streaming
- 📺 **TV Production** - Real-time scoreboard for TV broadcast
- 🖥️ **LED Display** - Score display for the venue
- 📱 **Mobile Apps** - Data source for mobile scoreboard apps
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
