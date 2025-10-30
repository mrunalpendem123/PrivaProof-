# How iroh Relays Enable Distributed Verification (Multi-User Scenario)

## The Problem You're Asking About:

**Scenario**: Tomorrow, 1000 people want to verify their identities
- User A publishes profile on Server 1
- Verifier on Server 2 needs to find User A's profile
- **How does Server 2 find profiles published on Server 1?**

---

## Current Issue: We Only Publish, We Don't Subscribe!

### What We Do Now (Only One-Way):

```rust
// Line 220: We broadcast our profiles
gossip_topic.broadcast(profile_bytes).await
```

**Problem**: 
- ✅ We broadcast profiles we create
- ❌ We DON'T listen for profiles from other nodes
- ❌ Verifier nodes can't find profiles published elsewhere

---

## Solution: Subscribe to Gossip Topic on Startup!

### How Distributed Profile System Should Work:

```
┌─────────────────────────────────────────────────────────┐
│                    Real-World Flow                       │
└─────────────────────────────────────────────────────────┘

1. User A verifies on Server 1 (issuer node)
   ↓
   Server 1 stores locally (iroh-blobs)
   ↓
   Server 1 broadcasts profile via gossip → relays
   ↓
   ┌─────────────────────────────────────────┐
   │  Relays route message to subscribed nodes│
   └─────────────────────────────────────────┘
   ↓
   Server 2 (verifier node) receives profile
   ↓
   Server 2 stores in local HashMap
   ↓
   Verifier queries Server 2 → finds User A's profile ✅

2. User B verifies on Server 3 (different issuer)
   ↓
   Server 3 broadcasts → relays → Server 2 receives
   ↓
   Server 2's HashMap now has: User A + User B ✅
```

---

## What We Need to Add:

### 1. **Persistent Gossip Subscription** (on startup)

```rust
// On server startup, subscribe to profile topic
let mut gossip_topic = gossip.subscribe_and_join(topic, vec![]).await?;

// Spawn background task to receive profiles from network
tokio::spawn(async move {
    while let Some(event) = gossip_topic.next().await {
        match event {
            Ok(Message { content, .. }) => {
                // Deserialize profile event
                if let Ok(profile) = serde_json::from_slice::<ProfileEvent>(&content) {
                    // Store in local HashMap (received from network)
                    profiles.write().await.insert(profile.username.clone(), profile);
                    info!("📥 Received profile from network: {}", profile.username);
                }
            }
            Err(e) => warn!("Gossip error: {}", e),
        }
    }
});
```

### 2. **Current State** (Missing Subscription):

```rust
// ❌ We only broadcast (one-way)
gossip_topic.broadcast(profile_bytes).await

// ❌ We don't listen for broadcasts from others
// ❌ get_profile() only looks in local HashMap
// ❌ HashMap only has profiles we created locally
```

---

## How iroh Relays Help (Even Without Permanent Storage):

### Relays Enable:

1. **Message Routing** (Critical!)
   ```
   Server 1 publishes → Relay routes → Server 2 receives
   ```
   - Relays route gossip messages between nodes
   - Without relays, nodes behind NATs can't communicate
   - With relays, any node can receive messages from any other node

2. **Network Discovery**
   - Relays help nodes find each other
   - Nodes don't need to know each other's IPs
   - Relay handles connection facilitation

3. **Event Distribution**
   - Profile published on one server
   - Relay distributes to all subscribed servers
   - Each server builds its own cache (HashMap)
   - **Result**: Distributed cache across network

---

## Complete Distributed Architecture:

```
┌─────────────────────────────────────────────────────────┐
│              Distributed Profile Registry                │
└─────────────────────────────────────────────────────────┘

Issue Node (Server 1)          Verifier Node (Server 2)
├─ Stores VC+Proof locally     ├─ Subscribes to gossip topic
├─ Publishes profile            ├─ Receives profiles from network
└─ Broadcasts via gossip       ├─ Stores in local HashMap
                                └─ Can query any profile

            Relay Network (iroh.network)
            ├─ Routes messages between nodes
            ├─ Helps nodes find each other (NAT traversal)
            └─ Distributes profile events
```

---

## Implementation Plan:

### Step 1: Add Background Subscription Task

```rust
// In main(), after gossip initialization:
let gossip_sub = gossip.clone();
let profiles_sub = profiles.clone();
let topic = get_profile_topic();

tokio::spawn(async move {
    // Subscribe to profile registry topic
    if let Ok(mut gossip_topic) = gossip_sub.subscribe_and_join(topic, vec![]).await {
        info!("📡 Subscribed to profile registry topic");
        
        // Continuously receive messages from network
        while let Some(event) = gossip_topic.next().await {
            match event {
                Ok(message) => {
                    // Parse profile event
                    if let Ok(profile) = serde_json::from_slice::<ProfileEvent>(&message.content) {
                        // Store in local HashMap
                        profiles_sub.write().await.insert(
                            profile.username.clone(),
                            profile
                        );
                        info!("📥 Received profile: {}", profile.username);
                    }
                }
                Err(e) => warn!("Gossip receive error: {}", e),
            }
        }
    }
});
```

### Step 2: Result

After this:
- ✅ Node receives profiles from across network
- ✅ HashMap grows with profiles from all issuers
- ✅ Any verifier can query any profile (if any node has it)
- ✅ Network-wide distribution without central server

---

## Real-World Example:

**Day 1:**
- User A verifies on Server 1 (US)
- Server 1 broadcasts profile
- Server 2 (EU) receives and stores

**Day 2:**
- User B verifies on Server 3 (Asia)
- Server 3 broadcasts profile
- Server 2 receives and stores
- **Server 2 now has: User A + User B** ✅

**Verifier on Server 2:**
- Queries for User A → Found ✅
- Queries for User B → Found ✅
- **Works across all servers in network!**

---

## Bottom Line:

**iroh relays DON'T store permanently, BUT:**
- ✅ They enable **message routing** between nodes
- ✅ They enable **network discovery** (nodes find each other)
- ✅ They enable **event distribution** (profiles spread across network)
- ✅ Each node builds **distributed cache** (HashMap) from network messages
- ✅ **Result**: True P2P distributed system without central storage!

**The storage is distributed across nodes' local HashMaps + iroh-blobs, connected via relay routing!**

