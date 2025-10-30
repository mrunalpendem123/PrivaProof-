#!/bin/bash

echo "🚀 Setting up DID Infrastructure..."

# Check if DIDKit is installed
if ! command -v didkit &> /dev/null; then
    echo "❌ DIDKit CLI not found. Installing..."
    echo "Please run: cargo install didkit-cli"
    echo "Then run this script again."
    exit 1
fi

echo "✅ DIDKit CLI found"

# Setup backend issuer key
echo "🔑 Setting up backend issuer key..."
cd backend
if [ ! -f "issuer_key.jwk" ]; then
    didkit generate-ed25519-key > issuer_key.jwk
    didkit key-to-did key -k issuer_key.jwk > issuer_did.txt
    echo "ISSUER_DID=$(cat issuer_did.txt)" > .env
    echo "✅ Issuer key generated"
else
    echo "✅ Issuer key already exists"
fi

cd ..

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend && npm install --legacy-peer-deps
cd ../backend && npm install
cd ../contracts && npm install --legacy-peer-deps
cd ..

echo "✅ Dependencies installed"

# Compile contracts
echo "🔨 Compiling smart contracts..."
cd contracts
npx hardhat compile
if [ $? -eq 0 ]; then
    echo "✅ Contracts compiled successfully"
else
    echo "❌ Contract compilation failed"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Hardhat node: cd contracts && npx hardhat node"
echo "2. Deploy contracts: cd contracts && npx hardhat run scripts/deploy.ts --network localhost"
echo "3. Update contract addresses in frontend files"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "See README.md for detailed instructions."
