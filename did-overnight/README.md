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

**Terminal 1: Hardhat Node (Blockchain)**
```bash
cd contracts
npx hardhat node
```
Keep this running - it starts local Ethereum node on `localhost:8545`

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

### Deploy Contracts

Once Hardhat node is running:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Important:** Update `CONTRACT_ADDRESS` in:
- `frontend/src/pages/Verify.tsx`
- `frontend/src/pages/Dashboard.tsx`

Also copy the ABI from `contracts/artifacts/contracts/DIDRegistry.sol/DIDRegistry.json` to both files.

### Setup MetaMask

1. Open MetaMask
2. Add Network:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Import Account:
   - Use private key from Hardhat node (printed in terminal)
   - Account will have 10000 ETH for testing

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

**Backend errors:** Make sure DIDKit CLI is installed and in PATH  
**Contract deployment fails:** Check Hardhat node is running  
**Frontend can't connect:** Verify backend on :3001, contracts node on :8545  
**MetaMask connection issues:** Ensure localhost network is added  

## 📚 Next Steps

1. Deploy real AnonAadhaar verifier contract
2. Map Anon Aadhaar proof format to contract parameters
3. Add error handling
4. Deploy to testnet (Polygon zkEVM recommended)

