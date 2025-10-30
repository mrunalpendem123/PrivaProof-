# Real iroh Integration Guide

Based on [iroh documentation](https://github.com/n0-computer/iroh) and production patterns.

## Overview

This guide helps migrate from HashMap-based storage to real iroh-blobs and iroh-gossip.

## Architecture

```
Backend API → iroh-node → iroh-blobs (storage)
                          ↓
                    iroh-gossip (profiles)
                          ↓
                    iroh Relays (P2P network)
```

## Step 1: Dependencies

Add to `services/iroh-node/Cargo.toml`:

```toml
[dependencies]
iroh = { version = "0.18", features = ["cli", "net"] }
iroh-blobs = "0.18"
iroh-gossip = "0.18"
iroh-net = "0.18"
```

## Step 2: Initialize iroh Node

```rust
use iroh::node::Node;

let node = Node::builder()
    .bind_addr("0.0.0.0:0".parse()?)
    .spawn()
    .await?;

// Get blob store
let blobs = node.blobs();

// Get gossip instance
let gossip = node.gossip();
```

## Step 3: Connect to Relays

```rust
// Public iroh relays
let relays = vec![
    "https://use1-1.relay.iroh.network/",  // US East
    "https://euw1-1.relay.iroh.network/",  // EU West
    "https://aps1-1.relay.iroh.network/",  // Asia Pacific
];

for relay in relays {
    match node.connect_to_relay(relay.parse()?).await {
        Ok(_) => info!("Connected to relay: {}", relay),
        Err(e) => warn!("Failed to connect to {}: {}", relay, e),
    }
}
```

## Step 4: Replace Blob Storage

### Current (HashMap):
```rust
BLOBS.lock().unwrap().insert(cid.clone(), json);
```

### Real iroh:
```rust
async fn post_blob(data: Vec<u8>) -> Result<String> {
    // Import into iroh-blobs store
    let hash = blobs.import_bytes(data).await?;
    
    // Hash is the CID (content-addressed)
    Ok(format!("{}", hash))
}

async fn get_blob(cid: &str) -> Result<Vec<u8>> {
    let hash: Hash = cid.parse()?;
    let blob = blobs.get(&hash).await?;
    Ok(blob.to_vec())
}
```

## Step 5: Replace Profile Storage with Gossip

### Current (HashMap):
```rust
PROFILES.lock().unwrap().insert(username, event);
```

### Real iroh-gossip:
```rust
use iroh_gossip::{Gossip, TopicId};

// Define topic for profile registry
let profile_topic = TopicId::from("did_profile_registry");

async fn publish_profile(event: ProfileEvent) -> Result<()> {
    let event_bytes = serde_json::to_vec(&event)?;
    
    // Publish to gossip topic (replicates across relays)
    gossip.publish_to_topic(profile_topic, event_bytes).await?;
    
    Ok(())
}

async fn get_profile(username: &str) -> Result<Option<ProfileEvent>> {
    // Query gossip topic for latest events
    let events = gossip.query_topic(profile_topic).await?;
    
    // Find latest event for this username
    for event_data in events {
        let event: ProfileEvent = serde_json::from_slice(event_data.data())?;
        if event.username == username {
            return Ok(Some(event));
        }
    }
    
    Ok(None)
}
```

## Step 6: Update HTTP Endpoints

Keep the same HTTP API, just swap the backend:

```rust
// POST /blobs
async fn post_blob(Json(body): Json<BlobIn>) -> Json<BlobOut> {
    let json = serde_json::json!({ "vc": body.vc, "proof": body.proof });
    let bytes = serde_json::to_vec(&json).unwrap();
    
    // Use real iroh instead of HashMap
    let cid = blobs.import_bytes(bytes).await.unwrap();
    
    Json(BlobOut { cid: format!("{}", cid) })
}

// GET /blobs/:cid
async fn get_blob(Path(cid): Path<String>) -> Result<Json<serde_json::Value>> {
    let hash: Hash = cid.parse()?;
    let blob_bytes = blobs.get(&hash).await?;
    let json: serde_json::Value = serde_json::from_slice(&blob_bytes)?;
    Ok(Json(json))
}
```

## Benefits

✅ **Distributed**: Data replicates across relay network  
✅ **Persistent**: Stored on disk, survives restarts  
✅ **Resilient**: Multiple relay copies  
✅ **Global**: Anyone can query any relay  
✅ **P2P**: Direct peer connections when possible  

## Testing

1. **Local testing**: Run local relay:
   ```bash
   iroh-relay-server --bind 127.0.0.1:4432
   ```

2. **Production**: Connect to public relays (already configured above)

## Migration Path

1. ✅ Add dependencies (see Step 1)
2. ⏳ Replace HashMap with iroh-blobs (see Step 4)
3. ⏳ Replace HashMap profiles with iroh-gossip (see Step 5)
4. ⏳ Connect to relays (see Step 3)
5. ⏳ Test locally
6. ⏳ Deploy to production

## Resources

- [iroh GitHub](https://github.com/n0-computer/iroh)
- [iroh Documentation](https://iroh.computer/)
- [iroh Examples](https://github.com/n0-computer/iroh/tree/main/examples)

