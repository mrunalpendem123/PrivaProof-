#!/bin/bash

echo "🚀 Starting DID Infrastructure..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Start Hardhat node in background
echo "🔗 Starting Hardhat node..."
cd contracts
if ! check_port 8545; then
    npx hardhat node > ../hardhat.log 2>&1 &
    HARDHAT_PID=$!
    echo "Hardhat node started (PID: $HARDHAT_PID)"
    
    # Wait for Hardhat to start
    echo "⏳ Waiting for Hardhat node to start..."
    sleep 5
    
    # Check if Hardhat is running
    if ! curl -s http://localhost:8545 > /dev/null; then
        echo "❌ Failed to start Hardhat node"
        exit 1
    fi
    echo "✅ Hardhat node is running"
else
    echo "✅ Hardhat node already running"
fi

# Deploy contracts
echo "📦 Deploying contracts..."
npx hardhat run scripts/deploy.ts --network localhost
if [ $? -ne 0 ]; then
    echo "❌ Contract deployment failed"
    exit 1
fi

cd ..

# Start backend
echo "🔧 Starting backend..."
cd backend
if ! check_port 3001; then
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend started (PID: $BACKEND_PID)"
    sleep 2
else
    echo "✅ Backend already running"
fi

cd ..

# Start frontend
echo "🌐 Starting frontend..."
cd frontend
if ! check_port 5173; then
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started (PID: $FRONTEND_PID)"
    sleep 3
else
    echo "✅ Frontend already running"
fi

cd ..

echo ""
echo "🎉 DID Infrastructure is running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "🔗 Hardhat: http://localhost:8545"
echo ""
echo "⚠️  Remember to:"
echo "1. Update contract addresses in frontend files"
echo "2. Install MetaMask and connect to localhost:8545"
echo "3. Import Hardhat account (private key in hardhat.log)"
echo ""
echo "📋 To stop all services:"
echo "kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📄 Logs:"
echo "- Hardhat: hardhat.log"
echo "- Backend: backend.log" 
echo "- Frontend: frontend.log"
