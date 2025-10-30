# Complete Technical Flow: DID + ZK Proof + iroh Publishing

## Architecture Overview

```
User (Frontend) → Backend API → iroh-node → In-Memory Storage (POC)
                                    ↓
                            BBS+ Signatures (ZK Proofs)
                            Ed25519 (DID & VC Signing)
                            BLAKE3 (Content Addressing)
```

---

## Step-by-Step Flow

### 1. DID Generation (`/api/did/generate`)

**Frontend**: `Verify.tsx` → `generateDID()`
```typescript
POST /api/did/generate
```

**Backend**: `apps/backend/src/index.ts:109-117`
- Generates Ed25519 keypair using Node.js `crypto.generateKeyPairSync('ed25519')`
- Exports public key as JWK (JSON Web Key)
- Derives `did:key` using base58btc encoding:
  - Format: `did:key:z{fingerprint}`
  - Fingerprint = base58(0xed + 0x01 + publicKeyBytes)
- Returns: `{ did: "did:key:z6Mk...", publicKeyJwk: {...} }`

**What's stored**: Nothing (session-only, ephemeral)

---

### 2. Verifiable Credential Issuance (`/api/credentials/issue`)

**Frontend**: `Verify.tsx` → `issueVC()`
```typescript
POST /api/credentials/issue
Body: { userDID: "did:key:z6Mk...", claims: { aadhaar_verified: true } }
```

**Backend**: `apps/backend/src/index.ts:119-133`
- Builds unsigned VC (W3C Verifiable Credential):
  ```json
  {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    "issuer": "did:key:z6Mk...",  // Backend's issuer DID (process-scoped)
    "issuanceDate": "2025-01-31T03:12:22.000Z",
    "credentialSubject": {
      "id": "did:key:z6Mk...",  // User's DID
      "aadhaar_verified": true
    }
  }
  ```
- Signs VC as JWS (JSON Web Signature) using Ed25519:
  - Header: `{ alg: 'EdDSA', kid: 'issuer-kid', typ: 'JWT' }`
  - Payload: VC JSON
  - Signature: Ed25519 signature over `header.payload`
  - Returns: `{ verifiableCredential: {...}, jws: "header.payload.signature" }`

**What's stored**: Nothing yet (just in memory, returned to frontend)

---

### 3. BBS+ ZK Proof Generation (`/api/proof/bbs/sign` + `/api/proof/bbs/derive`)

**Frontend**: `Verify.tsx` → `publishProfile()` → Step 3a & 3b

#### 3a. BBS+ Signature Creation

**Frontend**:
```typescript
POST /api/proof/bbs/sign
Body: { did: "did:key:z6Mk...", claims: { aadhaar_verified: true } }
```

**Backend**: `apps/backend/src/index.ts:205-219`
- Loads BBS library (`@mattrglobal/bbs-signatures`)
- Generates BLS12-381 G2 keypair (if not exists) - process-scoped issuer key
- Creates canonical messages array (4 messages):
  1. `"aadhaar_verified:true"`
  2. `"issued_at:1738277542"` (Unix timestamp)
  3. `"issuer_did:did:key:z6Mk..."`
  4. `"subject_did:did:key:z6Mk..."`
- Signs all 4 messages using `BBS.blsSign({ keyPair, messages })`
- Returns: `{ signature: "base64url...", messages: ["base64url...", ...] }`

**Cryptography**: BLS12-381 BBS+ signature (112 bytes). Multi-message signature where all 4 claims are signed together.

#### 3b. BBS+ Proof Derivation (Selective Disclosure)

**Frontend**:
```typescript
POST /api/proof/bbs/derive
Body: {
  signature: "base64url...",
  messages: ["base64url...", "base64url...", "base64url...", "base64url..."],
  disclosure: [true, false, false, false]  // Reveal only first message
}
```

**Backend**: `apps/backend/src/index.ts:221-264`
- Converts base64url messages/signature back to Uint8Array
- Maps `disclosure: [true, false, false, false]` → `revealedMessageIndices: [0]`
- Attempts `BBS.blsCreateProof()` with:
  - Original signature (all 4 messages signed)
  - All 4 messages (must match signed order)
  - `revealedMessageIndices: [0]` (reveal only `aadhaar_verified:true`)
- **If createProof fails** (WASM issue): Falls back to using signature itself as proof
- Returns: `{ proof: "base64url..." }`

**ZK Property**: Prover can prove they know `aadhaar_verified:true` was signed, WITHOUT revealing the other 3 messages (timestamp, issuer DID, subject DID). Verifier can verify this proof without seeing hidden messages.

**Current Status**: Due to BBS library WASM compatibility issue, currently falls back to signature-as-proof. Still cryptographically valid, just not selective disclosure yet.

---

### 4. Publishing to iroh (`/api/profile/publish`)

**Frontend**: `Verify.tsx` → `publishProfile()` → Step 4
```typescript
POST /api/profile/publish
Body: {
  username: "mrunalpendem123",
  did: "did:key:z6Mk...",
  vc: {...},  // Full VC from step 2
  proof: { proof: "base64url..." }  // BBS+ proof from step 3b
}
```

**Backend**: `apps/backend/src/index.ts:285-295`
- **Step 4a: Store VC+Proof as Blob**
  - POSTs to `iroh-node:4101/blobs` with `{ vc, proof }`
  - iroh-node (`services/iroh-node/src/main.rs:54-64`):
    - Serializes JSON deterministically: `{ "vc": {...}, "proof": {...} }`
    - Hashes with BLAKE3: `hash = blake3(bytes)`
    - Creates CID: `"bafy{base32(hash)}"`
    - Stores in-memory: `BLOBS[cid] = json`
    - Returns: `{ cid: "bafy..." }`

- **Step 4b: Publish Profile Mapping**
  - Creates canonical string: `username|did|cid|updated_at`
  - Signs with issuer's Ed25519 private key
  - POSTs to `iroh-node:4101/profiles/publish`:
    ```json
    {
      "username": "mrunalpendem123",
      "did": "did:key:z6Mk...",
      "proof_cid": "bafy...",
      "updated_at": 1738277542,
      "sig": "base64url..."
    }
    ```
  - iroh-node (`services/iroh-node/src/main.rs:74-78`):
    - Stores in-memory: `PROFILES[username] = profileEvent`
    - Returns: `{ ok: true }`

**What's stored in iroh-node**:
1. **Blob storage** (CID-indexed):
   ```json
   {
     "bafy...": {
       "vc": { "@context": [...], "credentialSubject": {...} },
       "proof": { "proof": "base64url..." }
     }
   }
   ```

2. **Profile registry** (username-indexed):
   ```json
   {
     "mrunalpendem123": {
       "username": "mrunalpendem123",
       "did": "did:key:z6Mk...",
       "proof_cid": "bafy...",
       "updated_at": 1738277542,
       "sig": "base64url..."
     }
   }
   ```

**Note**: Currently in-memory. In production, this would use:
- `iroh-blobs` for distributed blob storage (IPFS-like)
- `iroh-gossip` for profile event distribution across relays

---

### 5. Verifier Resolution (`/verifier` page)

**Frontend**: `VerifierPro.tsx` → User searches `@mrunalpendem123`

**Frontend API Call**: `apps/frontend/src/lib/api.ts:36-72`
```typescript
resolveIdentity("@mrunalpendem123")
```

#### Step 5a: Resolve Profile
```typescript
GET /api/iroh/profiles/mrunalpendem123
```
- Backend proxies to: `GET iroh-node:4101/profiles/mrunalpendem123`
- iroh-node (`services/iroh-node/src/main.rs:80-86`):
  - Looks up `PROFILES["mrunalpendem123"]`
  - Returns profile event:
    ```json
    {
      "username": "mrunalpendem123",
      "did": "did:key:z6Mk...",
      "proof_cid": "bafy...",
      "updated_at": 1738277542,
      "sig": "base64url..."
    }
    ```

#### Step 5b: Fetch VC+Proof Blob
```typescript
GET /api/iroh/blobs/bafy...
```
- Backend proxies to: `GET iroh-node:4101/blobs/bafy...`
- iroh-node (`services/iroh-node/src/main.rs:67-72`):
  - Looks up `BLOBS["bafy..."]`
  - Returns:
    ```json
    {
      "vc": { "@context": [...], "credentialSubject": {...} },
      "proof": { "proof": "base64url..." }
    }
    ```

#### Step 5c: Verify Proof (Optional)
```typescript
POST /api/proof/bbs/verify
Body: {
  proof: "base64url...",
  revealedMessages: ["base64url..."],  // Only revealed messages
  nonce: undefined
}
```
- Backend (`apps/backend/src/index.ts:266-283`):
  - Uses `BBS.blsVerifyProof()` with:
    - Proof (from blob)
    - Issuer's public key
    - Revealed messages only
  - Returns: `{ valid: true/false }`

**Frontend Display**: `VerifierPro.tsx` shows:
- Identity overview (username, DID, iroh hash/CID)
- Proof timeline (BBS+ proof with status)
- Audit log (verification events)
- Trust graph (connections to other issuers)

---

## Data Structures

### Verifiable Credential (VC)
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": "did:key:z6Mkt2X3wQbh68VNLXnTxbhtTFkv2Ude661iSGHdmNot1aNR",
  "issuanceDate": "2025-01-31T03:12:22.000Z",
  "credentialSubject": {
    "id": "did:key:z6MkvLLkehoasGSnXWKVbRLepLQcqMErC3k6r9vU3PwJhSa4",
    "aadhaar_verified": true
  }
}
```

**Signed as JWS**: `header.payload.signature` (Ed25519)

---

### BBS+ Messages (Canonical Format)
```typescript
[
  "aadhaar_verified:true",           // Message 0 (revealed)
  "issued_at:1738277542",            // Message 1 (hidden)
  "issuer_did:did:key:z6Mk...",      // Message 2 (hidden)
  "subject_did:did:key:z6Mk..."      // Message 3 (hidden)
]
```

**All 4 signed together** → Single BLS12-381 signature (112 bytes)

**Proof reveals only message 0** → Verifier sees `aadhaar_verified:true` without seeing timestamp/DIDs

---

### iroh Blob Storage
```
CID: bafy{base32(blake3(vc+proof_json))}
Content: {
  "vc": { ... },
  "proof": { "proof": "base64url..." }
}
```

**CID is deterministic**: Same VC+proof → Same CID (content-addressed)

---

### Profile Event (iroh Registry)
```json
{
  "username": "mrunalpendem123",
  "did": "did:key:z6MkvLLkehoasGSnXWKVbRLepLQcqMErC3k6r9vU3PwJhSa4",
  "proof_cid": "bafy...",
  "updated_at": 1738277542,
  "sig": "base64url..."  // Ed25519 signature over "username|did|cid|updated_at"
}
```

**Signed by issuer** → Prevents spoofing. Anyone can verify the signature.

---

## Cryptography Summary

| Component | Algorithm | Purpose |
|-----------|-----------|---------|
| **DID Generation** | Ed25519 | User's identity keypair |
| **VC Signing** | Ed25519 JWS | Issuer signs VC |
| **BBS+ Signature** | BLS12-381 G2 | Multi-message signature (4 claims) |
| **BBS+ Proof** | BLS12-381 PoK | Selective disclosure ZK proof |
| **Profile Signing** | Ed25519 | Issuer signs profile event |
| **Content Addressing** | BLAKE3 | Deterministic CID for VC+proof blob |
| **Encoding** | Base58btc, Base64url | DID fingerprints, API payloads |

---

## Current Status

✅ **Working**:
- DID generation (did:key, Ed25519)
- VC issuance (W3C standard, Ed25519 JWS)
- BBS+ signature creation (4 messages signed together)
- iroh blob storage (BLAKE3 CID)
- Profile publishing (username → DID → CID mapping)
- Verifier resolution (query by username, fetch CID)

⚠️ **Partial**:
- BBS+ selective disclosure: Currently falls back to signature-as-proof due to WASM library issue. Signature is still cryptographically valid, but not selective disclosure yet.

📝 **POC Limitations**:
- iroh-node uses in-memory storage (not distributed)
- No actual iroh relays/gossip (would require iroh-blobs + iroh-gossip crates)
- BBS+ createProof has WASM compatibility issue (fallback in place)

---

## Production Path

To make this production-ready:
1. Fix BBS+ selective disclosure (investigate WASM issue or use native module)
2. Integrate real iroh-blobs for distributed storage
3. Integrate iroh-gossip for relay-based profile distribution
4. Replace in-memory stores with persistent storage (Redis/DB)
5. Add profile revocation/updates

---

## Example Flow Trace

```
1. User opens /verify
2. Clicks "Generate DID"
   → POST /api/did/generate
   → Returns: did:key:z6MkvLLkehoasGSnXWKVbRLepLQcqMErC3k6r9vU3PwJhSa4

3. User bypasses Aadhaar (test mode)
   → Sets bypassMode = true

4. User clicks "Issue VC"
   → POST /api/credentials/issue
   → Backend creates VC, signs with Ed25519
   → Returns: { verifiableCredential: {...}, jws: "..." }

5. User enters username "mrunalpendem123", clicks "Publish Profile"
   
   5a. POST /api/proof/bbs/sign
       → Backend creates 4 messages, signs with BLS12-381
       → Returns: { signature: "...", messages: ["...", "...", "...", "..."] }
   
   5b. POST /api/proof/bbs/derive
       → Backend attempts selective disclosure proof
       → Falls back to signature (due to WASM issue)
       → Returns: { proof: "..." }
   
   5c. POST /api/profile/publish
       → Backend POSTs {vc, proof} to iroh-node/blobs
       → iroh-node: Hashes with BLAKE3 → CID "bafy..."
       → Backend POSTs profile to iroh-node/profiles/publish
       → iroh-node: Stores PROFILES["mrunalpendem123"] = {...}
       → Returns: { ok: true, cid: "bafy..." }

6. User navigates to /verifier
7. Verifier searches "@mrunalpendem123"
   
   7a. GET /api/iroh/profiles/mrunalpendem123
       → iroh-node returns profile event
   
   7b. GET /api/iroh/blobs/bafy...
       → iroh-node returns {vc, proof} blob
   
   7c. Frontend displays: Identity, Proof timeline, etc.
```

---

## Security Properties

1. **DID Authenticity**: Ed25519 signature on VC proves issuer
2. **VC Integrity**: JWS signature prevents tampering
3. **ZK Privacy**: BBS+ proof allows proving `aadhaar_verified:true` without revealing other claims (when selective disclosure works)
4. **Profile Authenticity**: Ed25519 signature on profile event prevents username hijacking
5. **Content Addressing**: BLAKE3 CID ensures blob integrity (tamper detection)

---

## Files Involved

- **Frontend**: `apps/frontend/src/pages/Verify.tsx` (issue flow)
- **Frontend**: `apps/frontend/src/pages/VerifierPro.tsx` (verification UI)
- **Backend**: `apps/backend/src/index.ts` (all API endpoints)
- **iroh-node**: `services/iroh-node/src/main.rs` (blob storage & profile registry)
- **Adapter**: `apps/frontend/src/lib/api.ts` (frontend → backend API calls)

