# 📦 Git Installation Guide

Panduan lengkap instalasi Livescore Listener dari GitHub repository untuk memudahkan instalasi dan update di masa depan.

**Repository:** https://github.com/saepulloh/livescore-badminton.git

---

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Installation](#initial-installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Update Procedure](#update-procedure)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🔧 Prerequisites

### Required Software

1. **Git**
   ```bash
   # Check if installed
   git --version
   
   # If not installed:
   # Windows: Download from https://git-scm.com/download/win
   # Mac: brew install git
   # Linux: sudo apt install git
   ```

2. **Node.js v16+**
   ```bash
   # Check version
   node --version
   
   # Should be v16.0.0 or higher
   # Download: https://nodejs.org/
   ```

3. **npm (comes with Node.js)**
   ```bash
   npm --version
   ```

---

## 🚀 Initial Installation

### Step 1: Clone Repository

```bash
# Navigate to desired location
cd /path/to/your/projects
# Example Windows: cd C:\Projects
# Example Mac/Linux: cd ~/Projects

# Clone repository
git clone https://github.com/saepulloh/livescore-badminton.git

# Enter directory
cd livescore-badminton
```

**Expected output:**
```
Cloning into 'livescore-badminton'...
remote: Enumerating objects: 50, done.
remote: Counting objects: 100% (50/50), done.
remote: Compressing objects: 100% (35/35), done.
Receiving objects: 100% (50/50), done.
```

---

### Step 2: Install Dependencies

```bash
# Install npm packages
npm install

# This will install:
# - socket.io-client@2.5.0
# - sails.io.js@1.2.1
# - dotenv@^16.0.3
```

**Expected output:**
```
added 15 packages, and audited 16 packages in 3s
found 0 vulnerabilities
```

---

### Step 3: Create Configuration File

```bash
# Copy example config
cp .env.example .env

# Edit configuration
nano .env
# Or on Windows: notepad .env
```

**Edit `.env` file:**
```env
# Livescore server URL (REQUIRED)
LIVESCORE_HOST=http://192.168.234.200:1337

# Court numbers to monitor (comma separated)
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8,9,10,11,12

# HTTP server port
PORT=6969
```

**Save file** (Ctrl+O, Enter, Ctrl+X in nano)

---

### Step 4: Verify Installation

```bash
# Check if all files exist
ls -la

# Should see:
# - livescore-listener-polling-only.js
# - package.json
# - .env
# - node_modules/
# - README.md
```

---

### Step 5: Test Connection

```bash
# Run diagnostic test
node test-connection.js

# Expected output:
# ✅ All tests passed!
```

If test fails, see [Troubleshooting](#troubleshooting) section.

---

## ⚙️ Configuration

### Environment Variables

Edit `.env` file to configure:

```env
# ============================================
# LIVESCORE SERVER
# ============================================
# REQUIRED: URL to your livescore server
# Format: http://hostname:port (no trailing slash)
LIVESCORE_HOST=http://192.168.234.200:1337

# ============================================
# COURT CONFIGURATION
# ============================================
# List of court numbers to monitor
# Format: comma separated numbers
DAFTAR_LAPANGAN=1,2,3,4,5,6,7,8

# ============================================
# HTTP SERVER
# ============================================
# Port for HTTP API server
# Default: 6969
PORT=6969
```

### Configuration Examples

**Single Court:**
```env
DAFTAR_LAPANGAN=1
```

**Multiple Courts:**
```env
DAFTAR_LAPANGAN=1,2,3,4,5,6
```

**Custom Port:**
```env
PORT=8080
```

**Remote Server:**
```env
LIVESCORE_HOST=http://livescore.example.com:1337
```

---

## 🏃 Running the Application

### Option 1: Direct Run (Recommended)

```bash
# Start application
node livescore-listener-polling-only.js

# Or using npm script
npm start
```

**Expected output:**
```
🏸 LIVESCORE SOCKET LISTENER

✅ Connected to Sails!
✅ Joined 12 rooms

👂 LISTENING FOR BROADCASTS...

🌐 HTTP Server: http://localhost:6969
```

---

### Option 2: Background Process (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start livescore-listener-polling-only.js --name livescore

# Check status
pm2 status

# View logs
pm2 logs livescore

# Stop
pm2 stop livescore

# Restart
pm2 restart livescore
```

---

### Option 3: Windows Service (PM2)

```bash
# Install PM2 startup
npm install -g pm2-windows-startup

# Setup startup
pm2-startup install

# Start app
pm2 start livescore-listener-polling-only.js --name livescore

# Save configuration
pm2 save

# App will now start on Windows boot
```

---

## 🔄 Update Procedure

### When to Update

Update when:
- New features released
- Bug fixes available
- Security patches
- Performance improvements

Check for updates:
```bash
# Check remote for updates
git fetch

# See what's new
git log HEAD..origin/main --oneline
```

---

### Step-by-Step Update

#### 1. Backup Current Configuration

```bash
# Backup .env file
cp .env .env.backup

# Backup custom modifications (if any)
# Note: Only if you modified the code
```

---

#### 2. Stop Application

```bash
# If running in terminal: Ctrl+C

# If using PM2:
pm2 stop livescore

# Or kill process
# Windows: taskkill /F /IM node.exe
# Linux/Mac: killall node
```

---

#### 3. Pull Latest Changes

```bash
# Make sure you're in the project directory
cd /path/to/livescore-badminton

# Pull latest changes
git pull origin main
```

**Expected output:**
```
remote: Enumerating objects: 10, done.
remote: Counting objects: 100% (10/10), done.
Updating abc1234..def5678
Fast-forward
 livescore-listener-polling-only.js | 15 ++++++++++++---
 README.md                          |  5 +++--
 2 files changed, 15 insertions(+), 5 deletions(-)
```

---

#### 4. Check for Dependency Changes

```bash
# Check if package.json changed
git diff HEAD@{1} package.json

# If package.json changed, update dependencies
npm install
```

---

#### 5. Restore Configuration

```bash
# Restore .env if overwritten
cp .env.backup .env

# Or manually verify .env is still correct
cat .env
```

---

#### 6. Test After Update

```bash
# Run diagnostic test
node test-connection.js

# Expected: ✅ All tests passed!
```

---

#### 7. Restart Application

```bash
# Direct run
node livescore-listener-polling-only.js

# Or with PM2
pm2 restart livescore

# Check logs for any errors
pm2 logs livescore --lines 50
```

---

### Update Script (Automated)

Create `update.sh` (Linux/Mac):
```bash
#!/bin/bash
echo "🔄 Updating Livescore Listener..."

# Backup config
cp .env .env.backup
echo "✅ Config backed up"

# Stop PM2 (if running)
pm2 stop livescore 2>/dev/null

# Pull changes
git pull origin main
echo "✅ Code updated"

# Install dependencies
npm install
echo "✅ Dependencies updated"

# Restore config
cp .env.backup .env
echo "✅ Config restored"

# Test
echo "🧪 Running tests..."
node test-connection.js

# Restart
pm2 restart livescore
echo "✅ Application restarted"

echo "🎉 Update complete!"
```

Make executable:
```bash
chmod +x update.sh
```

Run update:
```bash
./update.sh
```

---

### Update Script (Windows)

Create `update.bat`:
```batch
@echo off
echo 🔄 Updating Livescore Listener...

:: Backup config
copy .env .env.backup
echo ✅ Config backed up

:: Stop process
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Livescore*" 2>nul

:: Pull changes
git pull origin main
echo ✅ Code updated

:: Install dependencies
call npm install
echo ✅ Dependencies updated

:: Restore config
copy .env.backup .env
echo ✅ Config restored

:: Test
echo 🧪 Running tests...
node test-connection.js

:: Restart (if using PM2)
pm2 restart livescore

echo 🎉 Update complete!
pause
```

Run update:
```batch
update.bat
```

---

## 🐛 Troubleshooting

### Issue: Git Clone Fails

**Error:**
```
fatal: could not read Username for 'https://github.com'
```

**Solution:**
```bash
# If repository is private, use SSH
git clone git@github.com:saepulloh/livescore-badminton.git

# Or use personal access token
git clone https://TOKEN@github.com/saepulloh/livescore-badminton.git
```

---

### Issue: npm install Fails

**Error:**
```
npm ERR! code EACCES
```

**Solution:**
```bash
# Don't use sudo! Fix permissions instead
sudo chown -R $USER:$USER ~/.npm

# Or use Node Version Manager (nvm)
```

---

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::6969
```

**Solution:**
```bash
# Change port in .env
echo "PORT=7000" >> .env

# Or kill process using port
# Windows: netstat -ano | findstr :6969
# Linux/Mac: lsof -ti:6969 | xargs kill
```

---

### Issue: Connection Failed After Update

**Solution:**
```bash
# 1. Check .env file
cat .env

# 2. Verify versions
npm list socket.io-client
# Must be 2.5.0

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Test connection
node test-connection.js
```

---

### Issue: Git Pull Fails (Local Changes)

**Error:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Solution:**
```bash
# Option 1: Stash changes
git stash
git pull
git stash pop

# Option 2: Discard local changes
git reset --hard
git pull

# Option 3: Commit changes first
git add .
git commit -m "My local changes"
git pull
```

---

## 📚 Best Practices

### 1. Never Modify Core Files Directly

❌ **Don't:**
```bash
# Editing core files
nano livescore-listener-polling-only.js
```

✅ **Do:**
```bash
# Create custom version
cp livescore-listener-polling-only.js my-custom-listener.js
nano my-custom-listener.js
```

---

### 2. Always Backup .env Before Update

```bash
# Before every update
cp .env .env.backup.$(date +%Y%m%d)
```

---

### 3. Use Git Tags for Stable Versions

```bash
# Checkout specific version
git checkout v1.0.0

# List available versions
git tag -l

# Update to latest stable
git checkout main
git pull
```

---

### 4. Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update minor versions
npm update

# Update major versions (carefully!)
npm install socket.io-client@latest
```

---

### 5. Monitor for Updates

```bash
# Add to cron job (Linux/Mac)
# Check for updates daily
0 9 * * * cd /path/to/livescore-badminton && git fetch

# Or use GitHub watch feature
# Click "Watch" on repository page
```

---

## 📝 Git Workflow Cheatsheet

### Basic Commands

```bash
# Check status
git status

# See commit history
git log --oneline

# See current branch
git branch

# See remote URL
git remote -v

# Fetch updates (don't apply)
git fetch

# Pull updates (fetch + merge)
git pull

# Discard local changes
git reset --hard

# See what changed
git diff
```

---

### Update Workflow

```bash
# 1. Check for updates
git fetch
git log HEAD..origin/main --oneline

# 2. Backup
cp .env .env.backup

# 3. Stop app
pm2 stop livescore

# 4. Update
git pull origin main
npm install

# 5. Restore config
cp .env.backup .env

# 6. Test
node test-connection.js

# 7. Restart
pm2 restart livescore
```

---

## 🔐 Security Notes

### Protect .env File

```bash
# .env should be in .gitignore
cat .gitignore | grep .env

# Never commit .env to Git
git rm --cached .env  # If accidentally committed
```

---

### Use SSH Keys (Recommended)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and paste to GitHub Settings → SSH Keys

# Clone with SSH
git clone git@github.com:saepulloh/livescore-badminton.git
```

---

## 📞 Getting Help

### Check Repository Issues

```bash
# Open browser to issues page
open https://github.com/saepulloh/livescore-badminton/issues

# Or use GitHub CLI
gh issue list
```

---

### Report Bug

```bash
# Create issue with gh CLI
gh issue create --title "Bug: Connection fails after update" --body "Description..."

# Or open browser
open https://github.com/saepulloh/livescore-badminton/issues/new
```

---

## 🎯 Quick Reference

### First Time Setup
```bash
git clone https://github.com/saepulloh/livescore-badminton.git
cd livescore-badminton
npm install
cp .env.example .env
nano .env
npm start
```

### Update
```bash
cp .env .env.backup
pm2 stop livescore
git pull origin main
npm install
cp .env.backup .env
node test-connection.js
pm2 restart livescore
```

### Rollback
```bash
git log --oneline
git reset --hard COMMIT_HASH
npm install
pm2 restart livescore
```

---

## ✅ Installation Checklist

- [ ] Git installed and configured
- [ ] Node.js v16+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Connection test passed
- [ ] Application running successfully
- [ ] HTTP endpoints accessible
- [ ] vMix integration working
- [ ] Update script created
- [ ] Backup strategy in place

---

**Happy updating! Keep your livescore listener always up-to-date! 🚀**
