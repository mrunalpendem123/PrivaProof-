#!/bin/bash

echo "🚀 Deploying DID Registry to Ethereum Mainnet"
echo "=============================================="

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo "❌ Error: contracts/.env file not found!"
    echo ""
    echo "Please create contracts/.env with:"
    echo "INFURA_API_KEY=your_infura_api_key_here"
    echo "PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "You can get an Infura API key from: https://infura.io/"
    echo "Make sure your account has at least 0.01 ETH for gas fees"
    exit 1
fi

# Load environment variables
export $(cat contracts/.env | grep -v '#' | awk '/=/ {print $1}')

# Check if required variables are set
if [ -z "$INFURA_API_KEY" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: INFURA_API_KEY or PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📡 Using Infura endpoint: https://mainnet.infura.io/v3/$INFURA_API_KEY"

# Deploy to mainnet
echo ""
echo "🔄 Deploying contracts to Ethereum Mainnet..."
cd contracts

# Deploy with mainnet network
npx hardhat run scripts/deploy.ts --network mainnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployed contract addresses from above"
echo "2. Update CONTRACT_ADDRESS in frontend/src/pages/Verify.tsx"
echo "3. Update CONTRACT_ADDRESS in frontend/src/pages/Dashboard.tsx"
echo "4. Update CONTRACT_ABI in both files with the compiled ABI"
echo "5. Test the application on mainnet!"
