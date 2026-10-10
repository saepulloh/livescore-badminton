# 🪟 Windows Installation Guide

Complete guide to installing and setting up the **Livescore Listener** on Windows with the **one-click installer**.

---

## 📋 Table of Contents
- [Requirements](#requirements)
- [Quick Installation](#quick-installation)
- [Manual Installation](#manual-installation)
- [Running the Application](#running-the-application)
- [Windows Service Setup](#windows-service-setup)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Requirements

### Minimal Requirements
- **OS**: Windows 10 or Windows 11
- **RAM**: 512 MB minimum
- **Disk**: 100 MB free space
- **Node.js**: v20.x or newer (installed automatically if not present)

### Download Requirements
If Node.js is not installed yet:
- Download: [Node.js LTS](https://nodejs.org/en/download/)
- Choose: Windows Installer (.msi) - 64-bit

---

## ⚡ Quick Installation (Recommended)

### Method 1: Batch Installer

1. **Extract all files** to a folder (e.g. `C:\livescore-listener\`)

2. **Right-click `install.bat`** → **Run as Administrator**

3. **Follow the installer prompts:**
   ```
   ✓ Check Node.js installation
   ✓ Install dependencies automatically
   ✓ Create .env configuration
   ✓ Create launcher scripts
   ✓ Create desktop shortcuts
   ```

4. **Edit configuration** (optional):
   - Edit the `.env` file
   - Change `LIVESCORE_HOST`, `DAFTAR_LAPANGAN`, `PORT`

5. **Run the application:**
   - Double-click the **"Livescore Listener - Start"** shortcut on the desktop
   - Or run `start.bat`

✅ **Done!** Application is running on `http://localhost:6969`

---

## 🔨 Manual Installation

If you prefer manual installation:

### Step 1: Install Node.js
```
1. Download Node.js LTS from https://nodejs.org/
2. Run the installer and follow the wizard
3. Restart Command Prompt
4. Verify: node --version
```

### Step 2: Extract Files
```
Extract all files to the folder:
C:\livescore-listener\
```

### Step 3: Install Dependencies
```cmd
cd C:\livescore-listener
npm install
```

### Step 4: Create .env File
Create a `.env` file with the following content:
```env
LIVESCORE_HOST=http://localhost:1337
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12
PORT=6969
```

### Step 5: Run
```cmd
node livescore-listener-wib.js
```

---

## 🚀 Running the Application

### Option 1: Desktop Shortcut
Double-click a shortcut on the desktop:
- **"Livescore Listener - Start"** → Start application
- **"Livescore Listener - Status"** → Check status

---

### Option 2: Batch Files

**Start:**
```cmd
start.bat
```

**Stop:**
```cmd
stop.bat
```

**Check Status:**
```cmd
status.bat
```

**Test Endpoints:**
```cmd
test.bat
```

---

### Option 3: Command Line
```cmd
cd C:\livescore-listener
node livescore-listener-wib.js
```

---

### Option 4: PM2 (Advanced)

If you installed PM2 during installation:

**Start as service:**
```cmd
pm2 start ecosystem.config.js
```

**Stop:**
```cmd
pm2 stop livescore-listener
```

**Restart:**
```cmd
pm2 restart livescore-listener
```

**View Logs:**
```cmd
pm2 logs livescore-listener
```

**Monitor:**
```cmd
pm2 monit
```

**Status:**
```cmd
pm2 status
```

---

## 🔄 Windows Service Setup

Install as a Windows Service so it runs automatically at boot.

### Using PM2 (Recommended)

1. **Install PM2** (if not installed yet):
   ```cmd
   npm install -g pm2
   npm install -g pm2-windows-startup
   ```

2. **Setup startup:**
   ```cmd
   pm2-startup install
   ```

3. **Start application:**
   ```cmd
   pm2 start ecosystem.config.js
   ```

4. **Save PM2 config:**
   ```cmd
   pm2 save
   ```

5. **Done!** The service will auto-start at boot

---

### Using NSSM (Alternative)

1. **Download NSSM:**
   - Download: [NSSM - the Non-Sucking Service Manager](https://nssm.cc/download)
   - Extract `nssm.exe`

2. **Install service:**
   ```cmd
   nssm install LivescoreListener
   ```

3. **Configure in GUI:**
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\livescore-listener`
   - Arguments: `livescore-listener-wib.js`
   - Service name: `LivescoreListener`

4. **Start service:**
   ```cmd
   nssm start LivescoreListener
   ```

---

## 🌐 Testing Installation

### 1. Check if Node.js is running
Open browser and visit:
```
http://localhost:6969
```

You should see:
```json
{
  "name": "Livescore Socket Listener",
  "version": "1.0.0",
  "status": "connected"
}
```

---

### 2. Test Status Endpoint
```
http://localhost:6969/status
```

Should return:
```json
{
  "success": true,
  "timestamp": "16 Des 2025, 14:30:04 WIB",
  "connectionStatus": "connected"
}
```

---

### 3. Test vMix Endpoint
Individual:
```
http://localhost:6969/vmix-flat?id=1
```

Team event (beregu, team tournament):
```
http://localhost:6969/vmix-flat-beregu?id=1
```

Should return flat JSON data (as an array). The team event endpoint
returns `404 Court not found (beregu)` until the first team event (beregu)
event arrives on that court; check `http://localhost:6969/debug-beregu?id=1`.

---

### 4. Command Line Test
```cmd
curl http://localhost:6969/status
```

Or using PowerShell:
```powershell
Invoke-WebRequest http://localhost:6969/status
```

---

## 🛠️ Configuration

### Edit .env File

Open `.env` with Notepad:
```env
# Livescore host URL
LIVESCORE_HOST=http://your-server:1337

# Court list (comma separated)
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8

# HTTP Server Port
PORT=6969
```

**After editing:**
1. Save file
2. Restart application
3. Check status: `http://localhost:6969/status`

---

## 🔥 Firewall Configuration

If you cannot access it from another computer:

### Windows Firewall

1. **Open Windows Defender Firewall:**
   - Control Panel → System and Security → Windows Defender Firewall
   - Click "Advanced settings"

2. **Create Inbound Rule:**
   - Click "Inbound Rules" → "New Rule"
   - Type: Port
   - Protocol: TCP
   - Port: 6969
   - Action: Allow
   - Name: "Livescore Listener"

3. **Done!** Port 6969 is now accessible from other computers

---

## ❌ Troubleshooting

### Problem: "Node.js is not recognized"

**Solution:**
1. Reinstall Node.js
2. Check "Add to PATH" during installation
3. Restart Command Prompt
4. Test: `node --version`

---

### Problem: "Port 6969 already in use"

**Solution 1:** Kill process using port
```cmd
netstat -ano | findstr :6969
taskkill /PID <PID> /F
```

**Solution 2:** Change port in `.env`
```env
PORT=7000
```

---

### Problem: "Cannot find module 'dotenv'"

**Solution:**
```cmd
npm install
```

---

### Problem: Application crashes immediately

**Solution:**
1. Check `.env` configuration
2. Check LIVESCORE_HOST is accessible
3. Run with verbose logging:
   ```cmd
   node livescore-listener-wib.js
   ```
4. Check error messages

---

### Problem: "Connection refused"

**Solution:**
1. Check `LIVESCORE_HOST` in `.env`
2. Test livescore server:
   ```cmd
   curl http://livescore-server:1337
   ```
3. Check network connectivity
4. Check firewall settings

---

### Problem: Desktop shortcuts not working

**Solution:**
Recreate shortcuts manually:
1. Right-click on `start.bat`
2. Send to → Desktop (create shortcut)
3. Rename shortcut

---

### Problem: Can't access from vMix

**Solution:**
1. Check Windows Firewall (see Firewall Configuration)
2. Check port in `.env` (default: 6969)
3. Test from vMix PC:
   ```
   http://<server-ip>:6969/status
   ```
4. Make sure both PCs are on same network

---

## 📁 File Structure

```
C:\livescore-listener\
│
├── livescore-listener-wib.js    # Main application (individual + team event/beregu)
├── package.json                  # Dependencies
├── env.example                   # Config template
├── .env                          # Configuration
├── ecosystem.config.js           # PM2 config (optional, created by installer)
│
├── install.bat                   # Batch installer
│
├── start.bat                     # Start script (created by installer)
├── stop.bat                      # Stop script (created by installer)
├── status.bat                    # Status check (created by installer)
├── test.bat                      # Test script (created by installer)
│
└── Dokumentasi\
    ├── INSTALL-WINDOWS.md        # This file
    ├── VMIX-SETUP.md             # vMix integration guide
    ├── GIT-INSTALLATION.md       # Git installation guide
    └── PACKAGE-SUMMARY.md        # Package summary
```

---

## 🔄 Update Application

### Update Code
1. Backup `.env` file
2. Replace `livescore-listener-wib.js` with new version
3. Run `npm install` (if dependencies changed)
4. Restore `.env` file
5. Restart application

### Update Dependencies
```cmd
npm update
```

---

## 🗑️ Uninstall

### Manual Uninstall
1. Stop application:
   ```cmd
   stop.bat
   ```
2. If using PM2:
   ```cmd
   pm2 delete livescore-listener
   pm2 save
   ```
3. Delete folder:
   ```cmd
   rmdir /s C:\livescore-listener
   ```
4. Delete desktop shortcuts

### Using PM2
```cmd
pm2 delete livescore-listener
pm2 save
pm2-startup uninstall
npm uninstall -g pm2
npm uninstall -g pm2-windows-startup
```

---

## 📞 Support

### Check Logs
**Console output:**
```cmd
start.bat
```

**PM2 logs:**
```cmd
pm2 logs livescore-listener
```

**PM2 error logs:**
```cmd
pm2 logs livescore-listener --err
```

### Debug Mode
Add to `.env`:
```env
DEBUG=*
NODE_ENV=development
```

---

## ✅ Installation Checklist

- [ ] Node.js installed (v20+)
- [ ] Files extracted to folder
- [ ] Ran `install.bat`
- [ ] Dependencies installed (npm install)
- [ ] `.env` file configured
- [ ] Application starts without errors
- [ ] Can access `http://localhost:6969`
- [ ] Desktop shortcuts created
- [ ] Firewall configured (if needed)
- [ ] vMix can access endpoints

---

## 🎯 Quick Start After Installation

```cmd
# 1. Start application
start.bat

# 2. Open browser
http://localhost:6969

# 3. Check status
http://localhost:6969/status

# 4. Test vMix endpoint
http://localhost:6969/vmix-flat?id=1
```

**That's it! You're ready to integrate with vMix! 🎬🏸**

---

## 📚 Additional Documentation

- **vMix Integration** (individual & team event/beregu): See [VMIX-SETUP.md](VMIX-SETUP.md)
- **API Endpoints & Response Format**: See [README.md](../README.md)
- **Git Installation**: See [GIT-INSTALLATION.md](GIT-INSTALLATION.md)

---

**Need Help?** Check the documentation files or review the Troubleshooting section above.
