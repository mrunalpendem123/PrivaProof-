export type Identity = {
  id: string;
  username: string;
  did: string;
  iroh_hash: string;
  last_updated: string;
  profile_image_url?: string;
};

export type Proof = {
  id: string;
  proof_type: string;
  status: 'verified' | 'pending' | 'invalid';
  verified_at?: string | null;
  created_at: string;
  proof_hash: string;
  issuer_did: string;
  public_inputs: any;
};

export type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  details: { status?: 'verified' | 'pending' | 'invalid'; proof_type?: string };
};

export type TrustConnection = {
  id: string;
  issuer_name: string;
  issuer_did: string;
  connection_strength: number;
};

// Adapter: backend APIs
export async function resolveIdentity(query: string): Promise<{ identity: Identity | null; proofs: Proof[]; logs: AuditLog[]; connections: TrustConnection[]; }> {
  const name = query.startsWith('@') ? query.slice(1) : query;
  
  try {
    const profResp = await fetch(`/api/iroh/profiles/${encodeURIComponent(name)}`);
    if (!profResp.ok || profResp.status === 404) {
      return { identity: null, proofs: [], logs: [], connections: [] };
    }
    const profile = await profResp.json();
    const blobResp = await fetch(`/api/iroh/blobs/${encodeURIComponent(profile.proof_cid)}`);
    const blobJson = blobResp.ok ? await blobResp.json() : {};

    const identity: Identity = {
      id: profile.username,
      username: profile.username,
      did: profile.did,
      iroh_hash: profile.proof_cid,
      last_updated: new Date(profile.updated_at * 1000).toISOString(),
    };

    const proofs: Proof[] = [{
      id: profile.proof_cid,
      proof_type: 'BBS+ Selective Disclosure',
      status: 'verified',
      verified_at: new Date().toISOString(),
      created_at: new Date(profile.updated_at * 1000).toISOString(),
      proof_hash: profile.proof_cid,
      issuer_did: profile.did,
      public_inputs: blobJson?.vc || {},
    }];

    return { identity, proofs, logs: [], connections: [] };
  } catch (error) {
    console.error('resolveIdentity error:', error);
    return { identity: null, proofs: [], logs: [], connections: [] };
  }
}


