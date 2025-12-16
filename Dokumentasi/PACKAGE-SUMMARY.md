# 🎁 Livescore Listener - Complete Package

## 📦 What's Included

Anda sekarang memiliki **complete production-ready package** untuk Livescore Listener dengan Windows one-click installer!

---

## 📂 Files Overview

### 🚀 Core Application
| File | Description |
|------|-------------|
| `livescore-listener-wib.js` | Main application dengan WIB timestamp |
| `package.json` | Dependencies & scripts configuration |
| `.env.example` | Configuration template |
| `.gitignore` | Git ignore file |

### 🪟 Windows Installers
| File | Description |
|------|-------------|
| `install.bat` | **ONE-CLICK INSTALLER** (Batch) ⭐ |
| `install.ps1` | PowerShell installer (alternative) |
| `uninstall.bat` | Uninstaller |

**Auto-creates:**
- ✅ `start.bat` - Start application
- ✅ `stop.bat` - Stop application
- ✅ `status.bat` - Check status
- ✅ `test.bat` - Test endpoints
- ✅ Desktop shortcuts
- ✅ PM2 service (optional)

### 📚 Documentation
| File | Description | Priority |
|------|-------------|----------|
| `README.md` | Main documentation | ⭐⭐⭐ |
| `QUICK-START.md` | 5-minute quick start | ⭐⭐⭐ |
| `INSTALL-WINDOWS.md` | Complete Windows guide | ⭐⭐ |
| `VMIX-SETUP.md` | vMix integration guide | ⭐⭐⭐ |
| `FORMAT-COMPARISON.md` | API formats comparison | ⭐⭐ |
| `WIB-TIMESTAMP-UPDATE.md` | Timestamp format details | ⭐ |
| `DEPLOYMENT-CHECKLIST.md` | Production deployment guide | ⭐ |

---

## ⚡ Quick Start (Super Fast!)

### For End Users (Non-Technical)

1. **Extract files** ke folder (e.g., `C:\livescore-listener\`)

2. **Run ONE-CLICK INSTALLER:**
   - Klik kanan `install.bat`
   - Pilih **"Run as Administrator"**
   - Follow the prompts (installer will do everything!)

3. **Configure** (if needed):
   - Edit `.env` file dengan Notepad
   - Set your livescore server URL

4. **Start:**
   - Double-click desktop shortcut **"Livescore Listener - Start"**
   - Or run `start.bat`

5. **Test:**
   - Open browser: `http://localhost:6969`

✅ **DONE! Ready for vMix!**

---

### For Developers

```bash
# 1. Install dependencies
npm install

# 2. Configure
cp .env.example .env
nano .env

# 3. Run
node livescore-listener-wib.js

# 4. Test
curl http://localhost:6969/status
```

---

## 🎬 vMix Integration (2 Minutes)

1. **Start Livescore Listener** (from step above)

2. **In vMix:**
   - Add Input → Web Browser
   - URL: `http://localhost:6969/vmix-flat?id=1`
   - Tick "Reload every 1000ms"

3. **Create GT Title:**
   - Add text fields
   - Use data binding: `{{team1_name}}`, `{{team1_set1}}`, etc.

4. **Link Data Source:**
   - Select GT Title
   - Data Source → Web → Select your web input

✅ **Score updates every 1 second automatically!**

**Full guide:** See `VMIX-SETUP.md`

---

## 🌐 Available Endpoints

### For vMix (Recommended)

**Flat JSON (Best for vMix):**
```
http://localhost:6969/vmix-flat?id=1
```

**XML Format:**
```
http://localhost:6969/vmix-xml?id=1
```

### Other Endpoints

**API Documentation:**
```
http://localhost:6969/
```

**Connection Status:**
```
http://localhost:6969/status
```

**All Courts Data:**
```
http://localhost:6969/listpertandingan
```

**Specific Court (Full Data):**
```
http://localhost:6969/lapangan?id=1
```

**Event History:**
```
http://localhost:6969/events?limit=20
```

---

## 🔧 Configuration Options

Edit `.env` file:

```env
# Your livescore server URL
LIVESCORE_HOST=http://192.168.1.100:1337

# Court numbers to monitor
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8

# HTTP server port (change if 6969 is used)
PORT=6969
```

---

## 📖 Which Documentation to Read?

### I just want to use it quickly
→ Read `QUICK-START.md` (5 minutes)

### I need Windows installation help
→ Read `INSTALL-WINDOWS.md` (comprehensive guide)

### I need vMix integration
→ Read `VMIX-SETUP.md` (step-by-step with examples)

### I want to understand the API
→ Read `FORMAT-COMPARISON.md` (endpoint details)

### I'm deploying to production
→ Read `DEPLOYMENT-CHECKLIST.md` (full checklist)

### I want everything
→ Read `README.md` (complete documentation)

---

## 🎯 Use Cases

This package is perfect for:

- 🎬 **Live Streaming** - Add scoreboard overlay to badminton streams
- 📺 **TV Production** - Professional broadcast with real-time scores
- 🖥️ **LED Display** - Show scores on venue LED screens
- 📱 **Mobile Apps** - Data source for mobile scoreboard apps
- 🌐 **Web Dashboard** - Create custom web-based scoreboards

---

## ✨ Key Features

- ✅ **One-Click Installation** - Windows installer handles everything
- ✅ **vMix Ready** - Optimized formats for vMix integration
- ✅ **Real-Time Updates** - Score updates every second
- ✅ **Multi-Court Support** - Monitor up to 12 courts simultaneously
- ✅ **WIB Timezone** - Readable timestamps in WIB format
- ✅ **No Database** - Lightweight, runs in memory
- ✅ **Desktop Shortcuts** - Easy start/stop/status check
- ✅ **Service Mode** - Optional PM2 for auto-restart
- ✅ **Comprehensive Docs** - Full documentation included
- ✅ **Production Ready** - Tested and ready for live use

---

## 🛠️ What the Installer Does

When you run `install.bat`, it automatically:

1. ✅ Checks if Node.js is installed
2. ✅ Installs all dependencies (npm packages)
3. ✅ Creates `.env` configuration file
4. ✅ Creates batch scripts (start, stop, status, test)
5. ✅ Creates desktop shortcuts
6. ✅ (Optional) Installs PM2 for service mode
7. ✅ Tests the installation

**You don't need to do anything manually!**

---

## 🔄 Typical Workflow

### First Time Setup (5-10 minutes)
1. Extract files
2. Run `install.bat`
3. Edit `.env` (set livescore server URL)
4. Run `start.bat`
5. Configure vMix

### Daily Use (1 minute)
1. Double-click "Livescore Listener - Start" shortcut
2. Open vMix
3. Start streaming!

### Stop After Event (1 minute)
1. Run `stop.bat`
2. Or close the console window

---

## 💡 Pro Tips

### Tip 1: Use PM2 for Auto-Restart
```bash
# During installation, choose "Y" for PM2
# Application will auto-restart if it crashes
# Will auto-start on Windows boot
```

### Tip 2: Multiple Courts
```env
# Monitor courts 1-8 only
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8
```

### Tip 3: Remote Access
```bash
# Allow access from other PCs
# Configure Windows Firewall to allow port 6969
# vMix PC can access: http://192.168.1.100:6969/vmix-flat?id=1
```

### Tip 4: Test Before Live
```bash
# Always test before live event
curl http://localhost:6969/status
curl http://localhost:6969/vmix-flat?id=1
```

---

## 🐛 Troubleshooting Quick Reference

### Application won't start
```bash
# Check Node.js
node --version  # Should be v16+

# Reinstall dependencies
npm install
```

### Port already in use
```env
# Edit .env
PORT=7000
```

### Can't connect to livescore server
```env
# Check .env
LIVESCORE_HOST=http://correct-ip:1337

# Test connection
curl http://livescore-server:1337
```

### Data not updating
```bash
# Check events
curl http://localhost:6969/events?limit=10

# Restart application
stop.bat
start.bat
```

**Full troubleshooting:** See `INSTALL-WINDOWS.md` → Troubleshooting section

---

## 📦 Package Contents Checklist

### Files You Have
- [x] `livescore-listener-wib.js` - Main application
- [x] `package.json` - Dependencies
- [x] `.env.example` - Config template
- [x] `.gitignore` - Git ignore

### Installers
- [x] `install.bat` - Windows installer (Batch)
- [x] `install.ps1` - Windows installer (PowerShell)
- [x] `uninstall.bat` - Uninstaller

### Documentation
- [x] `README.md` - Main docs
- [x] `QUICK-START.md` - Quick guide
- [x] `INSTALL-WINDOWS.md` - Windows guide
- [x] `VMIX-SETUP.md` - vMix guide
- [x] `FORMAT-COMPARISON.md` - API reference
- [x] `WIB-TIMESTAMP-UPDATE.md` - Timestamp info
- [x] `DEPLOYMENT-CHECKLIST.md` - Production guide

---

## 🎓 Learning Path

### Beginner (Just Want to Use)
1. Read `QUICK-START.md` (5 min)
2. Run `install.bat` (5 min)
3. Read `VMIX-SETUP.md` → Quick Setup section (5 min)
4. **Total: 15 minutes**

### Intermediate (Want to Customize)
1. Read `README.md` (15 min)
2. Read `INSTALL-WINDOWS.md` (20 min)
3. Read `VMIX-SETUP.md` (15 min)
4. Read `FORMAT-COMPARISON.md` (10 min)
5. **Total: 60 minutes**

### Advanced (Production Deployment)
1. Read all documentation (60 min)
2. Read `DEPLOYMENT-CHECKLIST.md` (30 min)
3. Test all scenarios (60 min)
4. **Total: 150 minutes**

---

## 🚀 Next Steps

### To Get Started Now:
1. **Read:** `QUICK-START.md`
2. **Run:** `install.bat`
3. **Start:** `start.bat`
4. **Test:** Open `http://localhost:6969`

### For vMix Integration:
1. **Ensure** Livescore Listener is running
2. **Read:** `VMIX-SETUP.md` → Quick Setup
3. **Add** Web Input in vMix
4. **Test** with live match

### For Production Deployment:
1. **Read:** `DEPLOYMENT-CHECKLIST.md`
2. **Test** all scenarios
3. **Configure** Windows Firewall
4. **Setup** PM2 service mode
5. **Monitor** performance

---

## 📞 Need Help?

### Documentation
- Check the specific .md files for your use case
- Troubleshooting sections in each guide
- Examples provided throughout

### Common Questions
- "How to install?" → `INSTALL-WINDOWS.md`
- "How to use with vMix?" → `VMIX-SETUP.md`
- "What endpoints available?" → `FORMAT-COMPARISON.md`
- "How to deploy?" → `DEPLOYMENT-CHECKLIST.md`

---

## ✅ You're All Set!

You now have **everything needed** to:
- ✅ Install on Windows with one click
- ✅ Run Livescore Listener
- ✅ Integrate with vMix
- ✅ Deploy to production
- ✅ Troubleshoot issues
- ✅ Customize configuration

**Start with `QUICK-START.md` and you'll be streaming in 5 minutes!**

---

**Happy Streaming! 🏸🎬**
