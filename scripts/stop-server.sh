#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping all server processes...${NC}"

# Kill tsx server processes
if pkill -9 -f "tsx.*server.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Killed tsx server processes${NC}"
fi

# Kill node server processes
if pkill -9 -f "node.*server" 2>/dev/null; then
    echo -e "${GREEN}✅ Killed node server processes${NC}"
fi

# Kill any process using port 4000
if lsof -ti:4000 | xargs kill -9 2>/dev/null; then
    echo -e "${GREEN}✅ Freed port 4000${NC}"
fi

sleep 1

# Verify port is free
if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Warning: Port 4000 is still in use${NC}"
    echo -e "${YELLOW}Process on port 4000:${NC}"
    lsof -ti:4000 | xargs ps -p
else
    echo -e "${GREEN}✅ All servers stopped successfully${NC}"
    echo -e "${GREEN}✅ Port 4000 is free${NC}"
fi





