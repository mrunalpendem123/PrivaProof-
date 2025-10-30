# 🚀 Deploy to Ethereum Mainnet

This guide will help you deploy the DID Registry to Ethereum mainnet and make it fully functional.

## Prerequisites

1. **MetaMask Wallet** with at least 0.01 ETH for gas fees
2. **Infura API Key** from https://infura.io/
3. **Private Key** of your wallet (for deployment)

## Step 1: Get Infura API Key

1. Go to https://infura.io/
2. Sign up for a free account
3. Create a new project
4. Copy your API key from the project settings

## Step 2: Get Your Private Key

⚠️ **SECURITY WARNING**: Never share your private key with anyone!

1. Open MetaMask
2. Click on the account name (top right)
3. Click "Account Details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. Copy the private key

## Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   cd contracts
   cp env.example .env
   ```

2. Edit `.env` file with your credentials:
   ```
   INFURA_API_KEY=your_infura_api_key_here
   PRIVATE_KEY=your_private_key_here
   ```

## Step 4: Deploy to Mainnet

Run the deployment script:
```bash
cd /Users/mrunalpendem/Desktop/DIDs/did-overnight
./deploy-mainnet.sh
```

This will:
- Deploy the AnonAadhaar contract
- Deploy the DIDRegistry contract
- Show you the contract addresses

## Step 5: Update Frontend

After deployment, you'll get contract addresses. Update these files:

### Update Verify.tsx
```typescript
const CONTRACT_ADDRESS = '0x...'; // Your deployed DIDRegistry address
```

### Update Dashboard.tsx
```typescript
const CONTRACT_ADDRESS = '0x...'; // Your deployed DIDRegistry address
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY');
```

## Step 6: Test the Application

1. Make sure MetaMask is connected to Ethereum Mainnet
2. Go to http://localhost:5173
3. Follow the flow:
   - Generate DID
   - Skip Anon Aadhaar (use test data)
   - Issue VC
   - Store on Blockchain (this will cost real ETH!)
   - Verify on Dashboard

## Cost Estimation

- **Contract Deployment**: ~0.005 ETH (~$10-15)
- **Each DID Registration**: ~0.001 ETH (~$2-3)
- **Total for testing**: ~0.01 ETH (~$20-30)

## Security Notes

- Your private key is only used for deployment
- The contract is immutable once deployed
- All transactions are public on Ethereum
- Test thoroughly before using real funds

## Troubleshooting

### "Insufficient funds"
- Add more ETH to your wallet
- Check gas price settings

### "Contract not found"
- Verify contract address is correct
- Check if deployment was successful

### "Transaction failed"
- Check gas limit
- Verify network is Ethereum Mainnet
- Ensure sufficient ETH balance

## Next Steps

Once deployed, your DID system will be:
- ✅ Live on Ethereum mainnet
- ✅ Accessible worldwide
- ✅ Immutable and decentralized
- ✅ Real cryptographic proofs
- ✅ No pending transaction issues

The system will work exactly like before, but now it's on the real Ethereum blockchain!
