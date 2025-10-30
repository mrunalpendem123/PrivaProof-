# PrivaProof

A full-stack decentralized identity demo that links Aadhaar-backed verification to a Decentralized Identifier (DID), issues a W3C-style Verifiable Credential (VC), and anchors the VC hash on Ethereum (Sepolia). The UI lets users generate a DID, obtain a verification (Anon Aadhaar test mode or DigiLocker with simulation fallback), issue a VC, and register it on-chain; a dashboard verifies by DID without re-running verification.

## Repo Structure
- apps/frontend — React + TypeScript + Tailwind UI
- apps/backend — Node.js + Express + TypeScript API
- contracts — Solidity + Hardhat (`DIDRegistry`)
- docs — setup and troubleshooting notes
- scripts — helper scripts

## Quick Start

### Backend
```bash
cd apps/backend
npm install
npm run build
npm start
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
# open the printed http://localhost:5xxx
```

### Contracts
```bash
cd contracts
npm install
npx hardhat compile
# update deployed address in the frontend when you deploy
```

## Notes
- DigiLocker path currently uses a privacy-preserving commitment (hash) as a demo; Anon Aadhaar supports real Groth16 proofs in test mode.
- Secrets are env-based; copy env.example files and never commit real keys.
