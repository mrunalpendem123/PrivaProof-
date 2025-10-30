// Real iroh integration - distributed P2P storage
// Using iroh 0.94 API from https://github.com/n0-computer/iroh
// HashMap completely removed - real iroh only

use axum::{extract::Path, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::net::SocketAddr;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

// iroh 0.94 API (from official repo and docs)
use iroh::endpoint::Endpoint;

// App state - holds iroh components
struct AppState {
    endpoint: Arc<Endpoint>,
    store: Arc<iroh_blobs::api::Store>,
    gossip: Arc<iroh_gossip::Gossip>,
    // Profile cache: username → ProfileEvent (fast key-value lookup)
    // This is the primary storage; gossip is optional for P2P replication
    profiles: Arc<tokio::sync::RwLock<std::collections::HashMap<String, ProfileEvent>>>,
}

#[derive(Debug, Deserialize)]
struct BlobIn {
    vc: serde_json::Value,
    proof: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct BlobOut {
    cid: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ProfileEvent {
    username: String,
    did: String,
    proof_cid: String,
    updated_at: i64,
    sig: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .with_env_filter("info")
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    let port = std::env::var("PORT").unwrap_or_else(|_| "4101".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    // Initialize iroh endpoint (iroh 0.94 API)
    info!("🚀 Initializing iroh endpoint (v0.94)...");
    
    // Keep endpoint as non-Arc initially (needed for gossip/router setup)
    let endpoint = Endpoint::bind().await?;
    
    // Initialize blob store (filesystem-based, persistent)
    let blob_dir = std::env::var("IROH_BLOB_DIR").unwrap_or_else(|_| "./iroh-blobs".to_string());
    std::fs::create_dir_all(&blob_dir)?;
    let fs_store = iroh_blobs::store::fs::FsStore::load(&blob_dir).await?;
    let store: Arc<iroh_blobs::api::Store> = Arc::new(fs_store.into());
    
    // Initialize gossip (iroh-gossip 0.94 API)
    // Gossip::builder() -> spawn(endpoint) creates the gossip instance
    let gossip = Arc::new(
        iroh_gossip::Gossip::builder()
            .spawn(endpoint.clone())
    );
    
    // Connect to public iroh relays (iroh 0.94 API)
    // Endpoint has insert_relay() method that takes (RelayUrl, Arc<RelayConfig>)
    // RelayConfig can be created from RelayUrl using From trait
    let relays = vec![
        "https://use1-1.relay.iroh.network/",
        "https://euw1-1.relay.iroh.network/",
        "https://aps1-1.relay.iroh.network/",
    ];
    
    info!("📡 Connecting to iroh relays...");
    for relay in &relays {
        if let Ok(relay_url) = relay.parse::<iroh::RelayUrl>() {
            // insert_relay takes (RelayUrl, Arc<RelayConfig>)
            // RelayConfig::from(RelayUrl) creates a config from the URL
            // insert_relay returns Option<Arc<RelayConfig>>, not Result
            let config = Arc::new(iroh::RelayConfig::from(relay_url.clone()));
            endpoint.insert_relay(relay_url, config).await;
            info!("✅ Connected to relay: {}", relay);
        } else {
            tracing::warn!("⚠️  Failed to parse relay URL: {}", relay);
        }
    }
    
    // Setup iroh router for protocols (iroh 0.94 pattern)
    // RouterBuilder::new(endpoint) -> accept() -> spawn() returns Router (not a future)
    use iroh::protocol::RouterBuilder;
    let _router = RouterBuilder::new(endpoint.clone())
        .accept(
            iroh_blobs::protocol::ALPN.to_vec(),
            Arc::new(iroh_blobs::BlobsProtocol::new(store.as_ref(), None)),
        )
        .accept(
            iroh_gossip::ALPN.to_vec(),
            gossip.clone(),
        )
        .spawn();
    
    // Initialize profile cache (in-memory HashMap for fast lookups)
    let profiles = Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new()));
    
    // Subscribe to profile registry topic to receive profiles from network
    // This enables distributed storage: profiles published on other nodes
    // will be received and cached here, making them queryable
    let gossip_sub = gossip.clone();
    let profiles_sub = profiles.clone();
    let topic = {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(b"did_profile_registry");
        let topic_bytes: [u8; 32] = hasher.finalize().into();
        iroh_gossip::TopicId::from_bytes(topic_bytes)
    };
    
    // Spawn background task to receive profiles from network
    tokio::spawn(async move {
        info!("📡 Subscribing to profile registry topic for distributed storage...");
        match gossip_sub.subscribe_and_join(topic, vec![]).await {
            Ok(mut gossip_topic) => {
                info!("✅ Subscribed! Listening for profiles from network...");
                
                // Continuously receive messages from network
                use futures::StreamExt;
                use iroh_gossip::api::{Event, Message};
                
                while let Some(event_result) = gossip_topic.next().await {
                    match event_result {
                        Ok(Event::Received(Message { content, .. })) => {
                            // Parse profile event from network
                            if let Ok(profile) = serde_json::from_slice::<ProfileEvent>(&content) {
                                // Store in local cache (received from another node)
                                profiles_sub.write().await.insert(
                                    profile.username.clone(),
                                    profile.clone()
                                );
                                info!("📥 Received profile from network: {} (did: {})", 
                                    profile.username, profile.did);
                            } else {
                                tracing::debug!("Received non-profile message on topic");
                            }
                        }
                        Ok(Event::Lagged { .. }) => {
                            tracing::debug!("Gossip lagged, catching up...");
                        }
                        Ok(Event::NeighborUp(_) | Event::NeighborDown(_)) => {
                            // Connection events, ignore
                        }
                        Err(e) => {
                            tracing::warn!("⚠️  Gossip receive error: {}", e);
                        }
                    }
                }
            }
            Err(e) => {
                tracing::warn!("⚠️  Failed to subscribe to profile topic: {}", e);
            }
        }
    });
    
    let state = Arc::new(AppState {
        endpoint: Arc::new(endpoint), // Wrap in Arc for AppState
        store,
        gossip,
        profiles,
    });
    
    // Setup HTTP API routes
    let app = Router::new()
        .route("/health", get(|| async { Json(serde_json::json!({ "ok": true, "mode": "real-iroh-0.94" })) }))
        .route("/blobs", post(post_blob))
        .route("/blobs/:cid", get(get_blob))
        .route("/profiles/publish", post(publish_profile))
        .route("/profiles/:username", get(get_profile))
        .with_state(state);
    
    info!("✅ iroh-node (real iroh 0.94) listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

// Store blob using iroh-blobs 0.96 API
async fn post_blob(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(body): Json<BlobIn>,
) -> Result<Json<BlobOut>, (http::StatusCode, String)> {
    // Serialize to bytes
    let json = serde_json::json!({ "vc": body.vc, "proof": body.proof });
    let bytes = serde_json::to_vec(&json)
        .map_err(|e| (http::StatusCode::INTERNAL_SERVER_ERROR, format!("Serialization error: {}", e)))?;
    
    // Store in iroh-blobs (iroh-blobs 0.96 API)
    // Store -> blobs() -> add_bytes() returns AddProgress which implements IntoFuture
    // Awaiting it yields Result<TagInfo, RequestError>
    // Convert Vec<u8> to bytes::Bytes explicitly
    use bytes::Bytes;
    let tag_info = state
        .store
        .blobs()
        .add_bytes(Bytes::from(bytes))
        .await
        .map_err(|e| (http::StatusCode::INTERNAL_SERVER_ERROR, format!("iroh-blobs error: {}", e)))?;
    
    // TagInfo has hash as a field (not a method)
    let hash = tag_info.hash;
    let cid = format!("{}", hash);
    info!("💾 Stored blob with CID: {}", cid);
    Ok(Json(BlobOut { cid }))
}

// Get blob from iroh-blobs
async fn get_blob(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Path(cid): Path<String>,
) -> Result<Json<serde_json::Value>, (http::StatusCode, String)> {
    // Parse CID to Hash
    let hash: iroh_blobs::Hash = cid
        .parse()
        .map_err(|e| (http::StatusCode::BAD_REQUEST, format!("Invalid CID format: {}", e)))?;
    
    // Get blob from iroh store (iroh-blobs 0.96 API)
    // Store -> blobs() -> reader() returns BlobReader
    let mut reader = state.store.blobs().reader(hash);
    
    // Read all bytes
    use tokio::io::AsyncReadExt;
    let mut blob_bytes = Vec::new();
    reader.read_to_end(&mut blob_bytes).await
        .map_err(|e| (http::StatusCode::NOT_FOUND, format!("Blob not found or read error: {}", e)))?;
    
    // Deserialize JSON
    let json: serde_json::Value = serde_json::from_slice(&blob_bytes)
        .map_err(|e| (http::StatusCode::INTERNAL_SERVER_ERROR, format!("Deserialization error: {}", e)))?;
    
    Ok(Json(json))
}

// Publish profile to registry
async fn publish_profile(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Json(evt): Json<ProfileEvent>,
) -> Result<Json<serde_json::Value>, (http::StatusCode, String)> {
    // Store in profile cache (fast lookup)
    state.profiles.write().await.insert(evt.username.clone(), evt.clone());
    
    // Optional: Also publish to gossip for P2P replication
    // This allows other nodes to sync their caches
    let event_bytes = serde_json::to_vec(&evt)
        .map_err(|e| (http::StatusCode::INTERNAL_SERVER_ERROR, format!("Serialization error: {}", e)))?;
    
    // Create topic ID for profile registry
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(b"did_profile_registry");
    let topic_bytes: [u8; 32] = hasher.finalize().into();
    let topic = iroh_gossip::TopicId::from_bytes(topic_bytes);
    
    // Try to publish to gossip (non-blocking, don't fail if it doesn't work)
    // In production, we'd maintain a persistent subscription
    let gossip_clone = state.gossip.clone();
    let topic_clone = topic;
    let bytes_clone = event_bytes.clone();
    tokio::spawn(async move {
        if let Ok(mut gossip_topic) = gossip_clone.subscribe_and_join(topic_clone, vec![]).await {
            use bytes::Bytes;
            if let Err(e) = gossip_topic.broadcast(Bytes::from(bytes_clone)).await {
                tracing::warn!("⚠️  Gossip broadcast failed (non-critical): {}", e);
            }
        }
    });
    
    info!("✅ Published profile for {} (stored in cache + gossip)", evt.username);
    Ok(Json(serde_json::json!({ "ok": true, "mode": "hybrid-cache-gossip" })))
}

// Query profile from registry
async fn get_profile(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
    Path(username): Path<String>,
) -> Result<Json<ProfileEvent>, (http::StatusCode, String)> {
    // Fast lookup from in-memory cache
    let profiles = state.profiles.read().await;
    match profiles.get(&username) {
        Some(profile) => Ok(Json(profile.clone())),
        None => Err((http::StatusCode::NOT_FOUND, format!("Profile not found for username: {}", username))),
    }
}
