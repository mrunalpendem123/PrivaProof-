# Decentralized Identity System (DID + ZK-Proof + iroh)

A fully functional decentralized identity system with zero-knowledge proofs and P2P distribution via iroh.

## Features

- **Real iroh Integration**: Uses actual iroh-blobs, iroh-gossip, and public relays
- **BBS+ ZK Proofs**: Real cryptographic zero-knowledge proofs for selective disclosure
- **DID/VC Standards**: W3C-compliant Verifiable Credentials with Ed25519 signatures
- **P2P Distribution**: Profiles distributed across iroh network via gossip protocol
- **Dual Interface**: Verification flow + Verifier dashboard

## Architecture

```
Frontend (React) → Backend (Node.js) → iroh-node (Rust)
                                      ↓
                               iroh Network (P2P)
```

### Components

- **Frontend**: React + TypeScript, Vite
- **Backend**: Express + TypeScript, BBS+ signatures
- **iroh-node**: Rust microservice with iroh 0.94/0.96

## Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Cargo

### Start Services

```bash
# Terminal 1: iroh-node
cd services/iroh-node
PORT=4101 cargo run

# Terminal 2: Backend
cd apps/backend
PORT=3001 npm install && npm start

# Terminal 3: Frontend
cd apps/frontend
npm install && npm run dev
```

### Access

- **Verification Flow**: http://localhost:5174/verify
- **Verifier Dashboard**: http://localhost:5174/verifier
- **Backend API**: http://localhost:3001
- **iroh-node**: http://localhost:4101

## Project Structure

```
.
├── apps/
│   ├── frontend/     # React frontend
│   └── backend/      # Node.js API server
├── services/
│   └── iroh-node/    # Rust iroh service
└── docs/            # Documentation
```

## Key Technologies

- **iroh**: P2P networking, blob storage, gossip protocol
- **BBS+ Signatures**: Zero-knowledge proofs (@mattrglobal/bbs-signatures)
- **DID:key**: Ed25519-based DID generation
- **Verifiable Credentials**: W3C standard, JWS signed

## Documentation

- `docs/TECHNICAL_FLOW.md` - Complete technical flow
- `services/iroh-node/DISTRIBUTED_PROFILE_SYSTEM.md` - iroh architecture

## License

ISC
