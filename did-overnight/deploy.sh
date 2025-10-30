#!/bin/bash

echo "🚀 Deploying DID Infrastructure contracts..."

cd contracts

# Check if Hardhat node is running
if ! curl -s http://localhost:8545 > /dev/null; then
    echo "❌ Hardhat node not running on localhost:8545"
    echo "Please start it first: npx hardhat node"
    exit 1
fi

echo "✅ Hardhat node is running"

# Deploy contracts
echo "📦 Deploying contracts..."
npx hardhat run scripts/deploy.ts --network localhost

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Contracts deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the contract addresses from above"
    echo "2. Update CONTRACT_ADDRESS in:"
    echo "   - frontend/src/pages/Verify.tsx"
    echo "   - frontend/src/pages/Dashboard.tsx"
    echo "3. Copy ABI from: contracts/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
    echo "4. Update CONTRACT_ABI in both frontend files"
    echo ""
    echo "🔧 Contract ABI location:"
    echo "contracts/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
    echo ""
    echo "🌐 Start the application:"
    echo "Backend: cd backend && npm run dev"
    echo "Frontend: cd frontend && npm run dev"
else
    echo "❌ Contract deployment failed"
    exit 1
fi
