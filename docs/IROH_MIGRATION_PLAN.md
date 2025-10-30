# Migration Plan: HashMap → Real iroh

## Current State

- **Storage**: `HashMap<String, Value>` (in-memory)
- **Protocol**: None (just HTTP API)
- **Distribution**: Single process only
- **Persistence**: Lost on restart

## Target State

- **Storage**: `iroh-blobs` (distributed, persistent)
- **Registry**: `iroh-gossip` (relay-based profile distribution)
- **Protocol**: iroh P2P protocol
- **Distribution**: Multiple nodes via relays

## Migration Steps

### Step 1: Add iroh Dependencies

Add to `services/iroh-node/Cargo.toml`:

```toml
[dependencies]
iroh = { version = "0.18", features = ["cli", "net"] }
iroh-blobs = "0.18"
iroh-gossip = "0.18"
iroh-net = "0.18"
```

### Step 2: Initialize iroh Node

Replace HashMap with iroh node:

```rust
use iroh::node::Node;
use iroh_blobs::store::Store;
use iroh_gossip::{Gossip, TopicId};

// Initialize iroh node
let node = Node::builder().spawn().await?;
let blobs = node.blobs();
let gossip = node.gossip();
```

### Step 3: Update Blob Storage

Replace HashMap blob storage with iroh-blobs:

```rust
// Old:
BLOBS.lock().unwrap().insert(cid.clone(), json);

// New:
let hash = blobs.import_bytes(bytes).await?;
let cid = hash.to_string();
```

### Step 4: Implement Gossip for Profiles

Replace HashMap profile storage with iroh-gossip:

```rust
// Old:
PROFILES.lock().unwrap().insert(username, event);

// New:
let topic = TopicId::from("profile_registry");
gossip.publish_to_topic(topic, event_bytes).await?;
```

### Step 5: Connect to Relays

Add relay configuration:

```rust
let relays = vec![
    "https://use1-1.relay.iroh.network/",
    "https://euw1-1.relay.iroh.network/",
];
node.connect_to_relays(relays).await?;
```

## Implementation Details

See `services/iroh-node/src/main.rs` for full implementation.

