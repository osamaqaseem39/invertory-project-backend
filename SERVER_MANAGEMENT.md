# 🔧 SERVER MANAGEMENT GUIDE

## 🚀 **EASY SERVER COMMANDS**

### **Start Server (Recommended)**
```bash
npm run start:clean
```
This will:
- ✅ Stop any existing servers
- ✅ Free port 4000
- ✅ Start fresh server
- ✅ Run in foreground (Ctrl+C to stop)

### **Stop Server**
```bash
npm run stop
```
This will:
- ✅ Kill all server processes
- ✅ Free port 4000
- ✅ Clean shutdown

### **Development Mode (with auto-reload)**
```bash
npm run dev
```
This will:
- ✅ Start server with hot-reload
- ⚠️ Watch for file changes
- ⚠️ May cause EADDRINUSE if not stopped properly

---

## 🛑 **IF SERVER KEEPS CRASHING**

### **Quick Fix:**
```bash
# Stop everything
npm run stop

# Wait 2 seconds
sleep 2

# Start clean
npm run start:clean
```

### **Manual Fix:**
```bash
# Kill all processes on port 4000
lsof -ti:4000 | xargs kill -9

# Kill all tsx servers
pkill -9 -f "tsx.*server.ts"

# Verify port is free
lsof -ti:4000  # Should return nothing

# Start server
npm run start:clean
```

---

## 📊 **CHECK SERVER STATUS**

### **Check if server is running:**
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T20:42:37.788Z",
  "version": "v1",
  "environment": "development"
}
```

### **Check what's using port 4000:**
```bash
lsof -ti:4000
```

### **See server logs:**
```bash
tail -f /tmp/backend.log
```

---

## ⚠️ **COMMON ISSUES**

### **Issue 1: EADDRINUSE Error**
**Problem:** Port 4000 is already in use

**Solution:**
```bash
npm run stop
npm run start:clean
```

### **Issue 2: Server keeps restarting**
**Problem:** Multiple instances running

**Solution:**
```bash
# Kill ALL server processes
pkill -9 -f "tsx"
pkill -9 -f "node"
lsof -ti:4000 | xargs kill -9

# Wait and start fresh
sleep 2
npm run start:clean
```

### **Issue 3: Can't stop server**
**Problem:** Process won't die

**Solution:**
```bash
# Force kill everything
killall -9 node
killall -9 tsx

# Check port
lsof -ti:4000

# If still occupied, force kill that process
lsof -ti:4000 | xargs kill -9
```

---

## 🎯 **BEST PRACTICES**

### **✅ DO:**
- Use `npm run stop` before starting new server
- Use `npm run start:clean` for clean starts
- Use `Ctrl+C` to stop foreground servers
- Check health endpoint to verify server is running

### **❌ DON'T:**
- Run multiple `npm run dev` in different terminals
- Force kill without cleanup
- Leave zombie processes running
- Start server without checking port availability

---

## 📝 **AVAILABLE SCRIPTS**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Dev mode with hot-reload | Development |
| `npm run start:clean` | Clean start (kills existing) | Recommended |
| `npm run stop` | Stop all servers | Cleanup |
| `npm run build` | Compile TypeScript | Production prep |
| `npm run start` | Start compiled server | Production |

---

## 🔍 **TROUBLESHOOTING WORKFLOW**

1. **Server won't start?**
   ```bash
   npm run stop
   sleep 2
   npm run start:clean
   ```

2. **Still won't start?**
   ```bash
   pkill -9 -f "tsx"
   pkill -9 -f "node"
   npm run start:clean
   ```

3. **Still issues?**
   ```bash
   # Nuclear option - kill everything
   killall -9 node tsx
   lsof -ti:4000 | xargs kill -9
   sleep 3
   npm run start:clean
   ```

4. **Check it's working:**
   ```bash
   curl http://localhost:4000/health
   ```

---

## 🎉 **RECOMMENDED WORKFLOW**

### **Daily Development:**
```bash
# Morning - start fresh
npm run stop
npm run start:clean

# ... develop ...

# Evening - clean shutdown
Ctrl+C  # or npm run stop
```

### **Quick Restart:**
```bash
# One command restart
npm run stop && sleep 1 && npm run start:clean
```

### **Production Deployment:**
```bash
npm run build
NODE_ENV=production npm start
```

---

## 📞 **QUICK COMMANDS CHEAT SHEET**

```bash
# Start clean server
npm run start:clean

# Stop server
npm run stop

# Check health
curl http://localhost:4000/health

# View logs
tail -f /tmp/backend.log

# Kill everything (emergency)
npm run stop && pkill -9 tsx && pkill -9 node

# Restart
npm run stop && npm run start:clean
```

---

**💡 TIP:** Always use `npm run stop` before starting a new server to avoid port conflicts!

**🎯 GOAL:** Zero `EADDRINUSE` errors! 🚀





