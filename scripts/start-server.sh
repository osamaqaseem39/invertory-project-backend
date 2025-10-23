#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking for existing server processes...${NC}"

# Kill any existing server processes
pkill -9 -f "tsx.*server.ts" 2>/dev/null
pkill -9 -f "node.*server" 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null

# Wait for port to be freed
sleep 2

# Check if port is free
if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 4000 is still in use. Please try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Port 4000 is free${NC}"
echo -e "${YELLOW}🚀 Starting backend server...${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

# Start the server
npx tsx src/server.ts

# Note: This will run in foreground. 
# Press Ctrl+C to stop the server.





