# 🚀 Quick Start - DID Infrastructure

## What's Built

✅ **Complete DID Infrastructure** with:
- **Anon Aadhaar** - ZK proofs from Aadhaar QR codes
- **SpruceKit DIDKit** - W3C DIDs and Verifiable Credentials  
- **Ethereum** - Smart contracts for proof storage
- **React Frontend** - 4-step verification flow + dashboard
- **Express Backend** - DID generation and VC issuance

## 🎯 5-Minute Setup

### 1. Install DIDKit
```bash
cargo install didkit-cli
```

### 2. Run Setup
```bash
cd did-overnight
./setup.sh
```

### 3. Start Everything
```bash
./start.sh
```

### 4. Update Contract Addresses
After deployment, copy the contract addresses from terminal output to:
- `frontend/src/pages/Verify.tsx` (lines 8-9)
- `frontend/src/pages/Dashboard.tsx` (lines 4-5)

## 🧪 Test the Flow

1. **Open Frontend**: http://localhost:5173
2. **Generate DID**: Click "Generate My DID"
3. **Upload Aadhaar QR**: Use test data from Anon Aadhaar docs
4. **Generate ZK Proof**: Wait for proof generation
5. **Issue VC**: Click "Issue Verifiable Credential"
6. **Store on Blockchain**: Click "Store on Ethereum" (connect MetaMask)
7. **Verify**: Go to Dashboard, enter your DID

## 📁 Project Structure

```
did-overnight/
├── frontend/          # React + Anon Aadhaar + ethers.js
├── backend/           # Express + DIDKit
├── contracts/         # Hardhat + Solidity
├── setup.sh          # Automated setup
├── deploy.sh         # Contract deployment
└── start.sh          # One-command startup
```

## 🔧 Manual Commands (Sepolia)

If scripts don't work:

```bash
# Backend  
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Chain: Sepolia (no local node). Ensure MetaMask is on Sepolia and RPC is https://rpc.sepolia.org
```

## ⚠️ Troubleshooting

**Backend errors**: Make sure DIDKit is installed and in PATH  
**Contract issues**: Verify Sepolia RPC and address  
**Frontend can't connect**: Verify backend on :3001  
**MetaMask issues**: Ensure Sepolia is selected  

## 🎉 What You'll Have

- **Real ZK proofs** generated in browser
- **W3C compliant DIDs** and VCs
- **Ethereum smart contracts** storing proof mappings
- **Working dashboard** for verification queries
- **Complete end-to-end flow** from Aadhaar to blockchain

## 📚 Next Steps

1. Deploy to testnet (Polygon zkEVM recommended)
2. Add error handling and UI polish
3. Support multiple credential types
4. Add mobile app (SpruceKit Mobile SDK)

**Total build time: ~8 hours (overnight complete!)**
