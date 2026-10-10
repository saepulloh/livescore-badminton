# 🎬 vMix Integration Guide

A complete guide to integrating livescore-listener with vMix to display a badminton scoreboard in real time, for both **individual (individu) matches** and **team events (beregu, team tournaments)**.

---

## 📋 Table of Contents
- [Individual vs Team Event (Beregu)](#individual-vs-team-event-beregu)
- [Available Endpoints](#available-endpoints)
- [vMix Setup - Flat JSON](#vmix-setup---flat-json-recommended)
- [vMix Setup - XML](#vmix-setup---xml)
- [Sample Data](#sample-data)
- [Field Mapping](#field-mapping)
- [Troubleshooting](#troubleshooting)

---

## 🔀 Individual vs Team Event (Beregu)

The listener stores individual (individu) and team event (beregu) data **separately**. The broadcast operator picks the URL that matches the type of tournament currently running:

| Tournament type | JSON ⭐ | XML |
|-----------------|--------|-----|
| **Individual** | `/vmix-flat?id=N` | `/vmix-xml?id=N` |
| **Team event** (team, 3x55) | `/vmix-flat-beregu?id=N` | `/vmix-xml-beregu?id=N` |

Field names are **the same** for both types, so an individual GT Title can be reused for team events just by changing the URL. Team events only add a few fields (see [Field Mapping](#field-mapping)).

---

## 🔗 Available Endpoints

### 1. `/vmix-flat?id=N` and `/vmix-flat-beregu?id=N` ⭐ **RECOMMENDED**
Format: **Flat JSON** (wrapped in an array: `[ {...} ]`)  
Suitable for: **GT Title Designer** or **Web input**

**URL Example:**
```
http://localhost:6969/vmix-flat?id=1
http://localhost:6969/vmix-flat-beregu?id=1
```

**Advantages:**
- ✅ Flat structure, easy to map
- ✅ Simple field names with no nested objects
- ✅ Auto-updates on every point (score and serve indicator)
- ✅ Standard JSON format

---

### 2. `/vmix-xml?id=N` and `/vmix-xml-beregu?id=N`
Format: **XML**  
Suitable for: **Data Source (XML)**

**URL Example:**
```
http://localhost:6969/vmix-xml?id=1
http://localhost:6969/vmix-xml-beregu?id=1
```

**Advantages:**
- ✅ Native vMix XML support
- ✅ Easy drag-and-drop mapping
- ✅ Clear hierarchical structure

---

### 3. Debug endpoints
| Endpoint | Purpose |
|----------|---------|
| `/debug?id=N` | Internal data structure of an individual court |
| `/debug-beregu?id=N` | Internal data structure of a team event (beregu) court (context + liveScore) |

---

## 🚀 vMix Setup - Flat JSON (Recommended)

### Method 1: GT Title Designer + Web Input

#### Step 1: Run livescore-listener
```bash
npm start
# or
node livescore-listener-wib.js
```

#### Step 2: Test the endpoint in a browser
```
http://localhost:6969/vmix-flat?id=1
```

Make sure the data appears like this:
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

#### Step 3: Create a Title in GT Title Designer
1. Open **GT Title Designer**
2. Create a new title or edit an existing one
3. Add **Text fields** with data binding:

**Field Mapping Example (individual & team event):**
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

**Team event (beregu) extras:**
```
Match Type   → partai_label    (e.g. "Ganda Putra")
Match No.    → current_set
Tie Score    → sets_won_team1 - sets_won_team2
```

#### Step 4: Add Web Input in vMix
1. **Add Input** → **Web Browser**
2. Individual URL: `http://localhost:6969/vmix-flat?id=1`  
   Team event URL: `http://localhost:6969/vmix-flat-beregu?id=1`
3. Tick "**Reload every 1000ms**" (1 second)
4. **OK**

#### Step 5: Link the GT Title to the Web Input
1. Select the GT Title input
2. Click the **Data Source** button
3. Choose **Web**
4. Select the Web input you created (step 4)
5. **OK**

✅ **Done!** The score will auto-update every 1 second!

---

### Method 2: Script (Advanced - Direct JSON)

#### Step 1: Add a Script in vMix
```javascript
// vMix Script Example
var API = API;
var httpRequest = new XMLHttpRequest();

function updateScore() {
    httpRequest.open('GET', 'http://localhost:6969/vmix-flat?id=1', true);
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            // The response is an array, take the first element
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

            // ... update the other fields
        }
    };
    httpRequest.send();
}

// Update every 1 second
setInterval(updateScore, 1000);
```

---

## 📝 vMix Setup - XML

### Step 1: Run livescore-listener
```bash
npm start
```

### Step 2: Test the XML endpoint
```
http://localhost:6969/vmix-xml?id=1
```

It will produce XML like:
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

For **team events (beregu)** (`/vmix-xml-beregu?id=1`) the structure is the same, with the additional elements
`<partai_type>`, `<partai_label>`, `<current_set>` at the top level and
`<sets_won_team1>`, `<sets_won_team2>` inside `<scores>`.

### Step 3: Add a Data Source in vMix
1. **Add Input** → **Data Source**
2. Type: **XML**
3. URL: `http://localhost:6969/vmix-xml?id=1` (or `/vmix-xml-beregu?id=1`)
4. **Auto Update**: `1000` (1 second)
5. **OK**

### Step 4: Create a Title and Bind Data
1. Create a GT Title
2. Add text fields
3. Right-click the text → **Data Source**
4. Choose the XML data source
5. Navigate to the field (example: `match/team1/displayName`)
6. **OK**

✅ **Done!** vMix will auto-fetch the XML every 1 second!

---

## 📊 Sample Data

### Flat JSON Response, Individual (`/vmix-flat?id=1`)
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

### Flat JSON Response, Team Event (`/vmix-flat-beregu?id=1`)
Same fields as individual, with these added at the end:
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

    "...": "(score fields, winner, duration, etc. same as individual)",

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

> In team events, `tournament_name` and `round` are always empty (the backend payload has no source for them yet), and `teamN_playerM_club` contains the team's club name.

---

## 🗺️ Field Mapping

`N` = `1` or `2` (team number), `M` = `1` or `2` (player 1 or 2 / doubles partner).

| vMix Field | JSON Field | Description |
|------------|-----------|-------------|
| **Court** | `court` | Court number (1-12) |
| **Status** | `status` | `waiting`, `on_court`, `playing`, `finished` |
| **Tournament** | `tournament_name` | Tournament/category name (empty in team events) |
| **Round** | `round` | R1, R2, QF, SF, F, etc. (empty in team events) |
| **Match #** | `match_number` | Match sequence number (team event: match number within the tie) |
| | |
| **Team N Full Name** | `teamN_playerM_name` | Full name of player M |
| **Team N Short Name** | `teamN_playerM_displayName` | Short/display name of player M |
| **Team N Club** | `teamN_playerM_club` | Club/region of player M |
| **Team N Team Name** | `teamN_displayName` | Team display name; doubles joined with ` / ` |
| **Team N Serve** | `teamN_serve` | `true` if team N is serving |
| | |
| **Set M Team N** | `teamN_setM` | Team N's score in set M (1-3) |
| **Current Team N** | `teamN_current` | Team N's points in the current game |
| | |
| **Winner** | `winner` | Winner ID (0 = not finished yet) |
| **Retired** | `retired` | Retired status |
| **Duration** | `duration` | Match duration |
| **Last Update** | `last_update` | Full WIB timestamp |
| **Update Time** | `update_time` | Time only (HH:MM:SS) |

**Team event (beregu) only:**

| vMix Field | JSON Field | Description |
|------------|-----------|-------------|
| **Match Code** | `partai_type` | Alias of the match type (e.g. `MD`) |
| **Match Type** | `partai_label` | Name of the match type (e.g. Ganda Putra) |
| **Current Match/Set** | `current_set` | The set/match currently in progress |
| **Sets Won T1** | `sets_won_team1` | Number of sets won by team 1 |
| **Sets Won T2** | `sets_won_team2` | Number of sets won by team 2 |

---

## 🔧 Troubleshooting

### ❌ Data is not updating
**Check:**
1. Is `livescore-listener` running?
   ```bash
   curl http://localhost:6969/status
   ```

2. Is the socket connected?
   ```bash
   curl http://localhost:6969/status
   # Look for: "connectionStatus": "connected"
   ```

3. Are events coming in?
   ```bash
   curl http://localhost:6969/events?limit=10
   ```

4. Is vMix auto-reload active?
   - Check Web Input settings → Reload interval
   - Recommended: 1000ms (1 second)

### ❌ Field mapping does not work
**Check:**
1. Field names in the GT Title must **match exactly**
2. Case-sensitive: `team1_displayName` ≠ `team1_displayname`
3. Test the data in a browser before integrating
4. The `vmix-flat` response is an **array**, so make sure the binding reads the first element

### ❌ Score updates slowly
**Solutions:**
1. Reduce the reload interval to 500ms or 1000ms
2. Make sure there is no network latency
3. Check vMix CPU usage (it should not be too high)

### ❌ Error "Court not found"
**Check:**
1. Is the court listed in `DAFTAR_LAPANGAN`?
   ```bash
   # .env
   DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8
   ```

2. Has it joined the room?
   ```bash
   curl http://localhost:6969/status
   # Look for: "joinedRooms": ["court_1", "court_2", ...]
   ```

### ❌ Error "Court not found (beregu)"
A team event (beregu) court is only created after the listener receives the first team event
(`addPoint` with `klasemen_uid`, or a `liga*` event). Start a match in the
team event referee app (wasit beregu) first, then check:
```bash
curl http://localhost:6969/debug-beregu?id=1
```
If `context` is empty, look at the listener log (`Beregu context fetch failed`).

### ❌ Team event player/club names are empty
Names are taken from the *context*, which is refreshed on `liga*` events (changing match/set), not on every point. Make sure the referee has pressed PLAY / set the match, or check `lastContextFetch` in `/debug-beregu?id=N`.

### ❌ Serve indicator does not change
Serve is taken from the data of each point (`addPoint`). Make sure the referee has chosen the server/receiver and that points are coming in (check `/events?limit=10`).

---

## 🎨 Scoreboard Design Tips

### Minimalist
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

### Serve Indicator
Use `team1_serve` / `team2_serve` (boolean) to show a shuttlecock icon next to the team that is serving, for example with a visibility binding in the GT Title.

### Highlight Winner
Use conditional formatting in the GT Title:
```javascript
// Pseudo-code
if (team1_set1 > team2_set1) {
    team1_set1_color = "green"
    team1_set1_bold = true
}
```

---

## 📝 Setup Checklist

- [ ] livescore-listener is running
- [ ] Test `/vmix-flat?id=1` (individual) or `/vmix-flat-beregu?id=1` (team event) in a browser → data appears
- [ ] vMix GT Title has been created with the appropriate fields
- [ ] Web Input has been added with the correct URL
- [ ] Auto-reload at 1000ms is enabled
- [ ] Data Source has been linked to the GT Title
- [ ] Test with a real match → score and serve update

---

## 🎯 Best Practices

1. **Polling Interval**: 1000ms (1 second) - a balance between real-time and CPU usage
2. **Backup**: Use 2 courts (id=1 and id=2) for a seamless switch
3. **Error Handling**: Show "Waiting..." if the data is empty
4. **Preload**: Load the GT Title before the match starts
5. **Test**: Always test with dummy data before going live
6. **Team event (beregu)**: Change the URL to `-beregu` when switching from an individual tournament to a team one

---

## 📞 Support

If you run into problems:
1. Check the console log of `livescore-listener`
2. Check the `/events` endpoint to see socket events
3. Check `/status` for the connection status
4. Check `/debug?id=N` or `/debug-beregu?id=N` for a court's internal data
5. Make sure the firewall does not block port 6969

---

**Happy Streaming! 🎬🏸**
