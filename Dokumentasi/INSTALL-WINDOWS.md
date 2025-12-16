# 🪟 Windows Installation Guide

Panduan lengkap instalasi dan setup **Livescore Listener** di Windows dengan **one-click installer**.

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
- **OS**: Windows 10 atau Windows 11
- **RAM**: 512 MB minimum
- **Disk**: 100 MB free space
- **Node.js**: v16.x atau lebih baru (akan diinstall otomatis jika belum ada)

### Download Requirements
Jika Node.js belum terinstall:
- Download: [Node.js LTS](https://nodejs.org/en/download/)
- Choose: Windows Installer (.msi) - 64-bit

---

## ⚡ Quick Installation (Recommended)

### Method 1: Batch Installer

1. **Extract semua files** ke folder (misal: `C:\livescore-listener\`)

2. **Klik kanan `install.bat`** → **Run as Administrator**

3. **Follow the installer prompts:**
   ```
   ✓ Check Node.js installation
   ✓ Install dependencies automatically
   ✓ Create .env configuration
   ✓ Create launcher scripts
   ✓ Create desktop shortcuts
   ```

4. **Edit configuration** (optional):
   - Edit file `.env`
   - Change `LIVESCORE_HOST`, `DAFTAR_LAPANGAN`, `PORT`

5. **Run the application:**
   - Double-click **"Livescore Listener - Start"** shortcut di desktop
   - Or run `start.bat`

✅ **Done!** Application is running on `http://localhost:6969`

---

### Method 2: PowerShell Installer (Alternative)

1. **Extract semua files** ke folder

2. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Choose "Windows PowerShell (Admin)"

3. **Navigate to folder:**
   ```powershell
   cd C:\livescore-listener\
   ```

4. **Run installer:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File install.ps1
   ```

5. **Follow the prompts** dan selesai!

---

## 🔨 Manual Installation

Jika prefer instalasi manual:

### Step 1: Install Node.js
```
1. Download Node.js LTS dari https://nodejs.org/
2. Run installer dan follow wizard
3. Restart Command Prompt
4. Verify: node --version
```

### Step 2: Extract Files
```
Extract semua files ke folder:
C:\livescore-listener\
```

### Step 3: Install Dependencies
```cmd
cd C:\livescore-listener
npm install
```

### Step 4: Create .env File
Create file `.env` dengan isi:
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
Double-click shortcut di desktop:
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

Jika sudah install PM2 saat instalasi:

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

Install sebagai Windows Service agar running otomatis saat booting.

### Using PM2 (Recommended)

1. **Install PM2** (jika belum):
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

5. **Done!** Service akan auto-start saat booting

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
```
http://localhost:6969/vmix-flat?id=1
```

Should return flat JSON data.

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

# Daftar lapangan (comma separated)
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

Jika tidak bisa akses dari komputer lain:

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

3. **Done!** Port 6969 now accessible from other computers

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
├── livescore-listener-wib.js    # Main application
├── package.json                  # Dependencies
├── .env                          # Configuration
├── ecosystem.config.js           # PM2 config (optional)
│
├── install.bat                   # Batch installer
├── install.ps1                   # PowerShell installer
│
├── start.bat                     # Start script
├── stop.bat                      # Stop script
├── status.bat                    # Status check
├── test.bat                      # Test script
│
├── VMIX-SETUP.md                 # vMix integration guide
├── FORMAT-COMPARISON.md          # API format guide
├── WIB-TIMESTAMP-UPDATE.md       # Timestamp guide
└── INSTALL-WINDOWS.md            # This file
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

- [ ] Node.js installed (v16+)
- [ ] Files extracted to folder
- [ ] Ran `install.bat` or `install.ps1`
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

- **vMix Integration**: See `VMIX-SETUP.md`
- **API Endpoints**: See `FORMAT-COMPARISON.md`
- **Timestamp Format**: See `WIB-TIMESTAMP-UPDATE.md`

---

**Need Help?** Check the documentation files or review the Troubleshooting section above.
