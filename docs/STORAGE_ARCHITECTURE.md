# Storage Architecture: HashMap vs iroh-Gossip Protocol

## What We Currently Have

### HashMap (In-Memory Data Structure)

```rust
static BLOBS: Lazy<Mutex<HashMap<String, serde_json::Value>>> = ...;
static PROFILES: Lazy<Mutex<HashMap<String, ProfileEvent>>> = ...;
```

**What it is:**
- A **data structure** (like a JavaScript object or Python dictionary)
- Stores key-value pairs in RAM
- **Single process only** - no network communication
- **No protocol** - just direct memory access
- Data lost when process dies

**How it works:**
```
User → Backend API → iroh-node → HashMap (in RAM)
                           ↓
                    [No network, no relays]
```

**Limitations:**
- ❌ Only accessible from the same process
- ❌ No distribution across network
- ❌ No persistence (RAM only)
- ❌ No replication
- ❌ Other nodes can't access the data

---

## What iroh-Gossip Protocol Is

### iroh-Gossip (P2P Protocol + Relays)

**What it is:**
- A **distributed P2P protocol** (like BitTorrent or IPFS)
- Runs on **relays** (network servers)
- Uses **gossip protocol** (epidemic-style message spreading)
- **Network-based** - communicates over internet
- **Persistent** - stored across multiple nodes

**How it works:**
```
User → Backend API → iroh-node → iroh-gossip library
                                      ↓
                              P2P Network Protocol
                                      ↓
                ┌─────────────────────┼─────────────────────┐
                ↓                     ↓                     ↓
         Relay 1 (US)          Relay 2 (EU)        Relay 3 (Asia)
         [Stores profile]      [Stores profile]    [Stores profile]
                ↓                     ↓                     ↓
                    Gossip spreads updates automatically
```

**Features:**
- ✅ **Distributed** - multiple nodes store data
- ✅ **Resilient** - if one relay dies, others have copies
- ✅ **Persistent** - data survives node restarts
- ✅ **Network protocol** - TCP/QUIC-based communication
- ✅ **Gossip protocol** - automatic replication across network

---

## Comparison Table

| Aspect | HashMap (Current) | iroh-Gossip (Production) |
|--------|-------------------|---------------------------|
| **Type** | Data structure | Network protocol |
| **Storage** | RAM only | Disk + Network |
| **Distribution** | Single process | Multiple nodes (P2P) |
| **Persistence** | Lost on restart | Survives restarts |
| **Network** | None | TCP/QUIC |
| **Protocol** | None (just memory) | Gossip protocol (epidemic) |
| **Relays** | N/A | Required (network servers) |
| **Replication** | None | Automatic |
| **Access** | Local only | Global (via network) |

---

## How iroh-Gossip Protocol Works

### 1. **Relay-Based Architecture**

```
iroh-gossip connects to relays:
- Public: https://use1-1.relay.iroh.network/
- Local: iroh-relay-server --bind 127.0.0.1:4432
```

### 2. **Gossip Protocol (Epidemic Spreading)**

```
Node A publishes profile event
    ↓
Relay 1 receives it
    ↓
Relay 1 gossips to Relay 2, 3, 4... (spreads like gossip)
    ↓
All relays now have the profile
    ↓
Any node can query any relay to get the profile
```

### 3. **Topic-Based Publishing**

```rust
// In real iroh-gossip:
let topic = TopicId::from("username_registry");
gossip.publish_to_topic(topic, profile_event).await?;

// All relays subscribed to "username_registry" topic receive it
```

### 4. **Automatic Replication**

- Profile events replicate across relay network
- No manual sync needed
- Query any relay, get latest data

---

## Code Comparison

### Current (HashMap - No Protocol):

```rust
// Simple in-memory insert
PROFILES.lock().unwrap().insert(username, profile);

// Only accessible from this process
let profile = PROFILES.lock().unwrap().get(&username);
```

### Production (iroh-Gossip - Real Protocol):

```rust
// Connect to gossip network
let gossip = Gossip::new(relay_endpoints).await?;

// Publish to topic (goes to all relays)
let topic = TopicId::from("profile_registry");
gossip.publish_to_topic(topic, profile_event).await?;

// Query from any relay
let events = gossip.query_topic(topic).await?;
```

---

## Visual Difference

### HashMap (Current):
```
┌─────────────────────┐
│   iroh-node        │
│  ┌──────────────┐  │
│  │  HashMap     │  │  ← Just memory, no network
│  │  (in RAM)    │  │
│  └──────────────┘  │
└─────────────────────┘
   ↑
   Only accessible locally
```

### iroh-Gossip (Production):
```
┌─────────────────────┐
│   iroh-node        │
│  ┌──────────────┐  │
│  │ iroh-gossip  │──┼──┐
│  │   library    │  │  │  P2P Network
│  └──────────────┘  │  │
└─────────────────────┘  │
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌────────┐      ┌────────┐      ┌────────┐
   │ Relay1 │      │ Relay2 │      │ Relay3 │
   │(stores)│      │(stores)│      │(stores)│
   └────────┘      └────────┘      └────────┘
        ↑                ↑                ↑
        └────────────────┴────────────────┘
              Gossip protocol replicates data
```

---

## Summary

**HashMap:**
- ❌ **Not a protocol** - just a data structure
- ❌ **No relays** - no network communication
- ✅ **Simple** - works for POC/testing
- ❌ **Not distributed** - single process only

**iroh-Gossip:**
- ✅ **Real protocol** - network-based P2P protocol
- ✅ **Uses relays** - distributed network servers
- ✅ **Distributed** - data replicates across network
- ✅ **Production-ready** - resilient, persistent, global

The HashMap is just a **placeholder/simulation** of what real iroh-gossip would do, but without any network protocol or relay infrastructure.

