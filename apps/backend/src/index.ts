import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
// DigiLocker flow removed

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple DID generation without DIDKit
function generateDID(): { did: string; privateKey: string } {
  // Generate Ed25519 key pair
  const keyPair = crypto.generateKeyPairSync('ed25519');
  const publicKey = keyPair.publicKey.export({ type: 'spki', format: 'der' });
  const privateKey = keyPair.privateKey.export({ type: 'pkcs8', format: 'der' });
  
  // Create a simple DID (in production, use proper DID method)
  const publicKeyHash = crypto.createHash('sha256').update(publicKey).digest('hex');
  const did = `did:key:z6Mk${publicKeyHash.slice(0, 40)}`;
  
  return {
    did,
    privateKey: privateKey.toString('base64')
  };
}

// Simple VC issuance without DIDKit
function issueVC(userDID: string, anonAadhaarProof: any): any {
  const unsignedVC = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "AnonAadhaarCredential"],
    "issuer": "did:key:z6MkfY2r3X9v8w7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0",
    "issuanceDate": new Date().toISOString(),
    "credentialSubject": {
      "id": userDID,
      "anonAadhaarProof": anonAadhaarProof
    }
  };
  
  // Simple signature (in production, use proper cryptographic signing)
  const vcString = JSON.stringify(unsignedVC);
  const signature = crypto.createHash('sha256').update(vcString).digest('hex');
  
  return {
    ...unsignedVC,
    "proof": {
      "type": "Ed25519Signature2020",
      "created": new Date().toISOString(),
      "verificationMethod": "did:key:z6MkfY2r3X9v8w7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0#z6MkfY2r3X9v8w7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a0",
      "proofPurpose": "assertionMethod",
      "proofValue": signature
    }
  };
}

// Generate DID for user
app.post('/api/did/generate', async (req, res) => {
  try {
    const { did, privateKey } = generateDID();
    res.json({ did, privateKey });
  } catch (error: any) {
    console.error('Error generating DID:', error);
    res.status(500).json({ error: 'Failed to generate DID', message: error.message });
  }
});



// DigiLocker endpoints removed


// Issue Verifiable Credential
app.post('/api/credentials/issue', async (req, res) => {
  try {
    const { userDID, anonAadhaarProof } = req.body;
    
    const signedVC = issueVC(userDID, anonAadhaarProof);
    res.json({ verifiableCredential: signedVC });
  } catch (error: any) {
    console.error('Error issuing VC:', error);
    res.status(500).json({ error: 'Failed to issue credential', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on :${PORT}`);
  console.log('✅ Using simplified DID/VC generation (no DIDKit required)');
});

