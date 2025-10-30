# DID Infrastructure - Overnight Build

Decentralized Identity infrastructure using Anon Aadhaar (ZK proofs), SpruceKit (DIDs/VCs), and Ethereum (blockchain storage).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust/Cargo (for DIDKit CLI)
- MetaMask browser extension

### Installation

1. **Install DIDKit CLI:**
   ```bash
   cargo install didkit-cli
   ```

2. **Setup Backend Issuer Key:**
   ```bash
   cd backend
   didkit generate-ed25519-key > issuer_key.jwk
   didkit key-to-did key -k issuer_key.jwk > issuer_did.txt
   export ISSUER_DID=$(cat issuer_did.txt)
   ```

3. **Create .env file in backend:**
   ```bash
   cd backend
   echo "ISSUER_DID=$(cat issuer_did.txt)" > .env
   ```

### Running the Application

Network: Sepolia Testnet (no local node required)
• Ensure MetaMask is on Sepolia
• Use a public RPC like `https://rpc.sepolia.org` or your Infura endpoint

**Terminal 2: Backend API**
```bash
cd backend
npm run dev
```
Runs on `localhost:3001`

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```
Runs on `localhost:5173` (or similar Vite port)

### Contract Address & ABI

- Address is recorded in `contracts/addresses.json` (e.g., Sepolia)
- ABI is available at `contracts/abi/DIDRegistry.json`
- Frontend reads Sepolia via public RPC; no localhost chain needed

### Setup MetaMask (Sepolia)

1. Open MetaMask → Select “Sepolia Test Network”
2. If missing, add RPC: `https://rpc.sepolia.org`
3. Fund the account with Sepolia test ETH

## 📁 Project Structure

```
did-overnight/
├── frontend/          # React + TypeScript + Anon Aadhaar
├── backend/          # Express API + DIDKit
└── contracts/        # Hardhat + Solidity
```

## 🧪 Testing Flow

1. Open frontend (http://localhost:5173)
2. Click "Generate My DID"
3. Upload Aadhaar QR data (use test data from Anon Aadhaar docs)
4. Wait for ZK proof generation
5. Click "Issue Verifiable Credential"
6. Click "Store on Ethereum" (connect MetaMask if needed)
7. Navigate to Dashboard
8. Enter your DID to verify

## ⚠️ Known Limitations

- Contract needs real AnonAadhaar verifier (placeholder in deploy script)
- Proof formatting needs mapping from Anon Aadhaar format to contract format
- DIDKit must be installed globally
- Requires Rust/Cargo for DIDKit

## 🛠️ Troubleshooting

**Backend errors:** Ensure backend is running on :3001  
**Contract issues:** Verify Sepolia RPC and contract address in the app  
**Frontend can't connect:** Check backend on :3001  
**MetaMask connection issues:** Ensure Sepolia is selected  

## 📚 Next Steps

1. Deploy real AnonAadhaar verifier contract
2. Map Anon Aadhaar proof format to contract parameters
3. Add error handling
4. Deploy to testnet (Polygon zkEVM recommended)

