# iroh-node Service

Distributed P2P storage and profile registry using real iroh protocols.

## Architecture

- **iroh-blobs**: Real filesystem storage with content-addressed CIDs
- **iroh-gossip**: Real P2P messaging for profile distribution
- **iroh relays**: Connected to public iroh.network relays
- **Profile cache**: Fast in-memory HashMap for username lookups (syncs from gossip)

## Running

```bash
cd services/iroh-node
PORT=4101 cargo run
```

## API

- `GET /health` - Health check
- `POST /blobs` - Store VC + proof blob (returns CID)
- `GET /blobs/:cid` - Retrieve blob by CID
- `POST /profiles/publish` - Publish profile to network
- `GET /profiles/:username` - Query profile by username

## Configuration

- `PORT` - Server port (default: 4101)
- `IROH_BLOB_DIR` - Blob storage directory (default: ./iroh-blobs)

## Documentation

See `DISTRIBUTED_PROFILE_SYSTEM.md` for architecture details.
