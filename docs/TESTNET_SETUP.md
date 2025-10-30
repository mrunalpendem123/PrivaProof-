# 🌐 Deploy to Ethereum Sepolia Testnet

## Prerequisites

### 1. Get Infura API Key (Free)
1. Go to https://infura.io/
2. Sign up for free account
3. Create new project
4. Copy your API key

### 2. Get Sepolia Test ETH (Free)
1. Go to https://sepoliafaucet.com/
2. Enter your wallet address
3. Request test ETH (usually 0.1-0.5 ETH)
4. Wait for transaction confirmation

### 3. Get Your Private Key
1. Open MetaMask
2. Click account name → Account Details
3. Export Private Key
4. Enter MetaMask password
5. Copy the private key

## Setup Steps

### Step 1: Configure Environment
```bash
cd /Users/mrunalpendem/Desktop/DIDs/did-overnight/contracts
cp env.example .env
```

Edit `.env` file:
```
INFURA_API_KEY=your_infura_api_key_here
PRIVATE_KEY=your_private_key_here
```

### Step 2: Deploy to Testnet
```bash
cd /Users/mrunalpendem/Desktop/DIDs/did-overnight
./deploy-testnet.sh
```

This will:
- Deploy AnonAadhaar contract to Sepolia
- Deploy DIDRegistry contract to Sepolia
- Show contract addresses
- Give you next steps

### Step 3: Update Frontend
After deployment, update these files with the new contract address:

**Verify.tsx:**
```typescript
const CONTRACT_ADDRESS = '0x...'; // Your deployed address
```

**Dashboard.tsx:**
```typescript
const CONTRACT_ADDRESS = '0x...'; // Your deployed address
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY');
```

### Step 4: Add Sepolia to MetaMask
1. Open MetaMask
2. Click network dropdown
3. Add Network → Add a network manually
4. Enter:
   - **Network Name**: Sepolia Test Network
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY`
   - **Chain ID**: 11155111
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://sepolia.etherscan.io/

### Step 5: Test on Real Blockchain
1. Switch MetaMask to Sepolia
2. Go to http://localhost:5173
3. Run the complete flow
4. Check Sepolia Etherscan for your transactions!

## Benefits of Testnet

✅ **Real blockchain** - Ethereum testnet
✅ **Global access** - Anyone can verify your DIDs
✅ **Persistent** - Data stays forever
✅ **Free** - No real ETH required
✅ **Etherscan** - View transactions on blockchain explorer
✅ **Production-like** - Same as mainnet but with test ETH

## Cost Estimation

- **Contract Deployment**: ~0.001-0.005 Sepolia ETH (free from faucet)
- **Each DID Registration**: ~0.0001-0.0005 Sepolia ETH (free from faucet)
- **Total for testing**: Completely free!

## Verification

After deployment, you can:
1. **View on Etherscan**: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
2. **Share your DID**: Anyone can verify it globally
3. **Check transactions**: See all DID registrations on blockchain
4. **Test from anywhere**: Access from any computer

Ready to deploy to real blockchain? Let's do it! 🚀
