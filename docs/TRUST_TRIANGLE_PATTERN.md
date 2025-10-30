# trust-triangle Pattern Analysis

Based on the [trust-triangle repository](https://github.com/AireshBhat/trust-triangle), here's how to integrate real iroh:

## Repository Structure (trust-triangle)

```
trust-triangle/
├── src/              # Rust backend (iroh integration)
├── frontend/         # TypeScript frontend
├── docs/             # Documentation
└── Cargo.toml        # Rust dependencies
```

**Languages**: 55% TypeScript, 23% JavaScript, 22% Rust (matches our stack!)

## Standard iroh Integration Pattern

Based on iroh documentation and common patterns:

### 1. Dependencies (`Cargo.toml`)

```toml
[dependencies]
iroh = { version = "0.18", features = ["cli", "net"] }
iroh-blobs = "0.18"
iroh-gossip = "0.18"
iroh-net = "0.18"
axum = { version = "0.7", features = ["json"] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
```

### 2. Node Initialization

```rust
// Initialize iroh node (single instance, shared across handlers)
let node = Node::builder()
    .bind_addr("0.0.0.0:0".parse()?)
    .spawn()
    .await?;

// Connect to public relays
let relays = vec![
    "https://use1-1.relay.iroh.network/",
    "https://euw1-1.relay.iroh.network/",
];

for relay in relays {
    node.connect_to_relay(relay.parse()?).await?;
}
```

### 3. Blob Storage (iroh-blobs)

```rust
// Store: Returns Hash (CID) automatically
let hash = node.blobs().import_bytes(bytes).await?;
let cid = format!("{}", hash);

// Retrieve: Use Hash to get blob
let blob = node.blobs().get(&hash).await?;
```

### 4. Profile Registry (iroh-gossip)

```rust
// Define topic
let topic = TopicId::from("did_profile_registry");

// Publish: Replicates across relay network
node.gossip().publish_to_topic(topic, event_bytes).await?;

// Query: Get latest events from relay network
let events = node.gossip().query_topic(topic).await?;
```

## Complete Implementation

See `services/iroh-node/src/main_with_iroh.rs` for a complete working example.

## Migration Steps

1. **Add dependencies** (already done in `Cargo.toml`)
2. **Replace HashMap with iroh-blobs** for blob storage
3. **Replace HashMap with iroh-gossip** for profiles
4. **Connect to relays** (public or local)
5. **Test locally** with local relay
6. **Deploy** with public relays

## Key Differences from HashMap

| Operation | HashMap (Current) | iroh (Production) |
|-----------|-------------------|---------------|
| **Store blob** | `BLOBS.insert(cid, data)` | `node.blobs().import_bytes(data).await?` |
| **Get blob** | `BLOBS.get(&cid)` | `node.blobs().get(&hash).await?` |
| **Publish profile** | `PROFILES.insert(username, event)` | `node.gossip().publish_to_topic(topic, event).await?` |
| **Query profile** | `PROFILES.get(&username)` | `node.gossip().query_topic(topic).await?` |
| **Distribution** | Single process | Relay network (P2P) |
| **Persistence** | Lost on restart | Disk storage |

## Resources

- [iroh GitHub](https://github.com/n0-computer/iroh)
- [iroh Documentation](https://iroh.computer/docs)
- [trust-triangle repo](https://github.com/AireshBhat/trust-triangle) - Similar architecture

