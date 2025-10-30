#!/bin/bash

echo "🚀 Deploying DID Registry to Ethereum Sepolia Testnet"
echo "====================================================="

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo "❌ Error: contracts/.env file not found!"
    echo ""
    echo "Please create contracts/.env with:"
    echo "INFURA_API_KEY=your_infura_api_key_here"
    echo "PRIVATE_KEY=your_private_key_here"
    echo ""
    echo "You can get an Infura API key from: https://infura.io/"
    echo "You can get Sepolia test ETH from: https://sepoliafaucet.com/"
    echo "Make sure your account has at least 0.01 Sepolia ETH for gas fees"
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
echo "📡 Using Infura endpoint: https://sepolia.infura.io/v3/$INFURA_API_KEY"

# Deploy to Sepolia testnet
echo ""
echo "🔄 Deploying contracts to Ethereum Sepolia Testnet..."
cd contracts

# Deploy with sepolia network
npx hardhat run scripts/deploy.ts --network sepolia

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployed contract addresses from above"
echo "2. Update CONTRACT_ADDRESS in frontend/src/pages/Verify.tsx"
echo "3. Update CONTRACT_ADDRESS in frontend/src/pages/Dashboard.tsx"
echo "4. Update frontend to use Sepolia RPC instead of localhost"
echo "5. Add Sepolia network to MetaMask"
echo "6. Test the application on real testnet!"
echo ""
echo "🌐 Your contracts are now live on Ethereum Sepolia testnet!"
echo "🔗 View on Sepolia Etherscan: https://sepolia.etherscan.io/"
