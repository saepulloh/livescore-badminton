# Livescore Socket Listener

Socket listener untuk livescore badminton yang menyimpan data pertandingan di memori dan menyediakan HTTP API endpoint.

## Features

- 🔌 Connect ke Sails socket server (LIVESCORE_HOST)
- 📡 Listen events: `clearLapangan`, `play`, `playgame`, `updatescore`, `message`
- 💾 Simpan data pertandingan di memori
- 🌐 HTTP API untuk akses data pertandingan

## Installation

```bash
npm install
```

## Configuration

Buat file `.env` atau copy dari `.env.example`:

```env
LIVESCORE_HOST=http://localhost:1337
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12
PORT=6969
```

| Variable | Default | Description |
|----------|---------|-------------|
| `LIVESCORE_HOST` | `http://localhost:1337` | URL socket server Sails |
| `DAFTAR_LAPANGAN` | `1,2,3,4,5,6,7,8,9,10,11,12` | Daftar lapangan yang akan di-join (comma-separated) |
| `PORT` | `6969` | Port HTTP server |

## Usage

```bash
# Production
npm start

# Development (dengan auto-reload)
npm run dev
```

## HTTP API Endpoints

### GET `/listpertandingan`
Menampilkan data pertandingan dari semua lapangan.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connectionStatus": "connected",
  "joinedRooms": ["court_1", "court_2", ...],
  "totalCourts": 12,
  "data": {
    "1": {
      "status": "playing",
      "currentScore": {...},
      "matchInfo": {...},
      "scores": [...],
      "lastUpdate": "2024-01-01T00:00:00.000Z"
    },
    ...
  }
}
```

### GET `/status`
Menampilkan status koneksi dan konfigurasi.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "livescoreHost": "http://localhost:1337",
  "connectionStatus": "connected",
  "joinedRooms": ["court_1", "court_2", ...],
  "daftarLapangan": ["1", "2", ...],
  "totalEvents": 150,
  "uptime": 3600
}
```

### GET `/events`
Menampilkan history event yang diterima.

**Query Parameters:**
- `limit` (optional): Jumlah event yang ditampilkan (default: 100)

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalEvents": 150,
  "showing": 100,
  "events": [
    {
      "type": "updatescore",
      "data": {...},
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    ...
  ]
}
```

### GET `/lapangan?id=N`
Menampilkan data untuk lapangan tertentu.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "lapangan": "1",
  "data": {
    "status": "playing",
    "currentScore": {...},
    "matchInfo": {...},
    "scores": [...],
    "lastUpdate": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/clear`
Menghapus semua data dari memori (untuk testing).

### GET `/`
Home page dengan daftar endpoint yang tersedia.

## Socket Events

Script ini listen ke event-event berikut:

| Event | Description |
|-------|-------------|
| `clearLapangan` | Match selesai, lapangan di-clear |
| `play` | Data dari joinRoomWasit |
| `playgame` | Match sedang berlangsung di court |
| `updatescore` | Update score real-time |
| `message` | Pesan broadcast |

## Data Structure

Data pertandingan disimpan per-lapangan dengan struktur:

```javascript
{
  "lapangan_id": {
    "status": "waiting|on_court|playing|finished",
    "matchInfo": {},      // Data dari playgame event
    "playData": {},       // Data dari play event
    "currentScore": {},   // Score terbaru
    "scores": [],         // History semua score updates
    "initialData": {},    // Data saat join room
    "finishData": {},     // Data saat match selesai
    "joinedAt": "...",
    "lastUpdate": "..."
  }
}
```

## License

MIT
