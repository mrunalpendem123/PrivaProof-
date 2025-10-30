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


