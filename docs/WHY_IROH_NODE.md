# Why We Have a Separate "iroh-node" Service

## The Question

**If we're not using real iroh protocol/relays, why do we have a separate "iroh-node" service?**

## Short Answer

It's a **facade/mock service** that:
1. **Mimics the API** that real iroh would provide
2. **Separates concerns** (storage vs business logic)
3. **Makes migration easy** (swap HashMap for real iroh later)
4. **Allows testing** the full flow with correct architecture

But you're right - we could put HashMap directly in the backend!

---

## Current Architecture

```
Frontend → Backend API (Node.js) → iroh-node (Rust) → HashMap (RAM)
            ↑                           ↑
      Business logic              Storage layer
```

### What Each Layer Does

**Backend API (`apps/backend/`)**:
- DID generation
- VC issuance (Ed25519 JWS)
- BBS+ proof creation
- Business logic orchestration
- Calls iroh-node for storage

**iroh-node (`services/iroh-node/`)**:
- Blob storage (VC+proof)
- Profile registry (username → DID mapping)
- CID generation (BLAKE3)
- Currently: HashMap (in-memory)
- Future: Real iroh-blobs + iroh-gossip

---

## Reasons for Separate Service

### 1. **API Compatibility** (Future-Proofing)

We designed it to match what real iroh would provide:

```rust
// Current API (HashMap backend)
POST /blobs → HashMap.insert()
GET /blobs/:cid → HashMap.get()
POST /profiles/publish → HashMap.insert()
GET /profiles/:username → HashMap.get()
```

When we switch to real iroh, the API stays the same:

```rust
// Real iroh API (same endpoints!)
POST /blobs → iroh_blobs::Store::store()
GET /blobs/:cid → iroh_blobs::Store::get()
POST /profiles/publish → iroh_gossip::publish()
GET /profiles/:username → iroh_gossip::query()
```

**Backend doesn't need to change** - just swap the implementation!

---

### 2. **Separation of Concerns**

```
Backend (Node.js)          iroh-node (Rust)
├─ DID generation          ├─ Blob storage
├─ VC issuance             ├─ CID generation  
├─ BBS+ proofs             ├─ Profile registry
└─ Business logic          └─ Storage layer
```

**Benefits:**
- Backend focuses on business logic
- iroh-node focuses on storage
- Can scale/replace independently
- Cleaner code organization

---

### 3. **Language Separation**

- **Backend**: Node.js/TypeScript (easy for web devs)
- **iroh-node**: Rust (performance, iroh libraries are Rust)

Real iroh libraries are Rust-native, so having a Rust service makes migration easier.

---

### 4. **Easy Migration Path**

**Current**:
```rust
// services/iroh-node/src/main.rs
static BLOBS: HashMap<String, Value> = ...;
```

**Future (just swap the storage layer)**:
```rust
// services/iroh-node/src/main.rs
use iroh_blobs::Store;
let store = Store::memory()?;  // or Store::fs()?
```

The HTTP API endpoints stay the same, backend code doesn't change!

---

### 5. **Testing & Development**

- Can test backend logic without real iroh infrastructure
- Can run iroh-node separately (different port)
- Easy to mock/replace for testing
- Matches production architecture pattern

---

## Could We Skip It?

**Yes!** We could put HashMap directly in the backend:

```typescript
// apps/backend/src/index.ts
const BLOBS = new Map<string, any>();

app.post('/api/profile/publish', async (req, res) => {
  // Store directly in backend
  BLOBS.set(cid, {vc, proof});
  // ...
});
```

**Why we didn't:**
1. Would make migration harder later (need to refactor backend)
2. Mixes storage with business logic
3. Real iroh is Rust-only, so we'd need Rust anyway
4. Wanted to match production architecture

---

## What "iroh-node" Really Is

**It's NOT:**
- ❌ Running real iroh protocol
- ❌ Connected to iroh relays
- ❌ Using iroh-gossip
- ❌ Distributed P2P storage

**It IS:**
- ✅ HTTP API facade
- ✅ Mimics iroh API structure
- ✅ Uses HashMap (placeholder)
- ✅ Ready for iroh migration
- ✅ Separates storage concerns

Think of it as a **"iroh-compatible storage service"** that currently uses HashMap but will use real iroh later.

---

## Real iroh vs Our "iroh-node"

### Real iroh Node:
```
iroh-node (real)
├─ iroh-blobs (distributed storage)
├─ iroh-gossip (relay protocol)
├─ iroh-net (P2P networking)
└─ Connected to relays
```

### Our "iroh-node" (POC):
```
iroh-node (our version)
├─ HashMap (in-memory)
├─ HTTP API (matches iroh structure)
├─ BLAKE3 CID generation
└─ No P2P, no relays
```

Same API, different implementation!

---

## Summary

We run a separate "iroh-node" service because:
1. **Architecture** - Matches production pattern (separate storage layer)
2. **Migration** - Easy to swap HashMap for real iroh later
3. **API Design** - Same endpoints as real iroh would provide
4. **Separation** - Storage logic separate from business logic
5. **Testing** - Can test full flow without real iroh infrastructure

But you're absolutely right - for a POC, we could skip it and just use HashMap in the backend! We chose this approach for cleaner architecture and easier future migration.

---

## Could We Simplify?

**Yes!** If you want to simplify for now:

**Option 1: Keep it** (current) - Best for production migration path
**Option 2: Merge into backend** - Simpler, but harder to migrate later
**Option 3: Remove it entirely** - Use a database/file storage in backend

The current setup is a **"best practices"** approach that makes migration easier, but adds complexity for a POC.

