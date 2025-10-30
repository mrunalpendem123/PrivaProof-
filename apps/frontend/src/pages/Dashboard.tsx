import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSearchParams } from 'react-router-dom';

// Contract address and ABI from deployment
const CONTRACT_ADDRESS = '0xC3372161Ba52efe386955a3Fb221F2269039228a';
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_anonAadhaarAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "did",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "vcHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CredentialRegistered",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "anonAadhaar",
    "outputs": [
      {
        "internalType": "contract AnonAadhaar",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "name": "didToCredential",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "vcHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "did",
        "type": "string"
      }
    ],
    "name": "getCredential",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "vcHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          }
        ],
        "internalType": "struct DIDRegistry.Credential",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "did",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "vcHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "nullifierSeed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "nullifier",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "signal",
        "type": "uint256"
      },
      {
        "internalType": "uint256[4]",
        "name": "revealArray",
        "type": "uint256[4]"
      },
      {
        "internalType": "uint256[8]",
        "name": "groth16Proof",
        "type": "uint256[8]"
      }
    ],
    "name": "registerDID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "did",
        "type": "string"
      }
    ],
    "name": "revoke",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface Credential {
  vcHash: string;
  timestamp: string;
  isValid: boolean;
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [did, setDid] = useState('');
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill DID from URL params and auto-query
  useEffect(() => {
    const didFromUrl = searchParams.get('did');
    if (didFromUrl) {
      console.log('📥 DID from URL:', didFromUrl);
      setDid(didFromUrl);
      // Auto-query after a short delay to let state update
      setTimeout(() => {
        checkVerification(didFromUrl);
      }, 500);
    }
  }, [searchParams]);

  const checkVerification = async (didToCheck?: string) => {
    const targetDid = didToCheck || did;
    if (!targetDid) {
      alert('Please enter a DID');
      return;
    }
    
    setLoading(true);
    try {
        if (CONTRACT_ADDRESS === 'YOUR_DEPLOYED_CONTRACT_ADDRESS') {
          alert('⚠️ Contract not deployed yet! Deploy contracts first and update CONTRACT_ADDRESS in Dashboard.tsx');
          return;
        }

      console.log('🔍 Querying blockchain for DID:', targetDid);
      console.log('📋 Contract address:', CONTRACT_ADDRESS);

      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      console.log('📞 Calling getCredential...');
      const cred = await contract.getCredential(targetDid);
      console.log('📦 Raw credential data:', cred);
      console.log('📦 Credential details:', {
        vcHash: cred.vcHash,
        timestamp: cred.timestamp.toString(),
        isValid: cred.isValid,
        timestampNumber: Number(cred.timestamp)
      });
      
      // Check if credential exists - if timestamp is 0, it doesn't exist
      if (cred && Number(cred.timestamp) > 0) {
        console.log('✅ Credential found!');
        setCredential({
          vcHash: cred.vcHash,
          timestamp: new Date(Number(cred.timestamp) * 1000).toLocaleString(),
          isValid: cred.isValid
        });
      } else {
        console.error('❌ Credential not found or invalid:', {
          cred,
          timestamp: cred?.timestamp?.toString(),
          timestampNumber: cred ? Number(cred.timestamp) : 'null'
        });
        alert('DID not found on blockchain');
        setCredential(null);
      }
        } catch (error: any) {
          console.error('❌ Error checking verification:', error);
          alert('Failed to check verification: ' + error.message + '\nMake sure you have a valid Infura API key and the contract is deployed to mainnet');
          setCredential(null);
        } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">Verification Dashboard</h1>
        <p className="text-gray-600">Verify decentralized identities linked to ZK proofs on the blockchain</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg border-l-4 border-blue-500">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <span className="text-2xl">🔍</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Lookup Identity</h2>
            <p className="text-sm text-gray-600">Enter a DID to verify its Aadhaar proof linkage</p>
          </div>
        </div>
        
        <label className="block mb-2 font-semibold text-gray-700">Decentralized Identifier (DID):</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            placeholder="did:key:z6Mkf..."
            className="flex-1 border-2 border-gray-300 focus:border-blue-500 p-3 rounded-lg outline-none transition-colors"
          />
          <button 
            onClick={() => checkVerification()} 
            disabled={loading || !did}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </span>
            ) : '🔍 Verify'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Paste a DID from the verification flow to check its on-chain status
        </p>
      </div>

      {credential && (
        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-lg border-2 border-green-500 shadow-xl">
          <div className="flex items-start mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mr-4 shadow-lg">
              <span className="text-4xl text-white">✓</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-green-700 mb-1">Identity Verified</h2>
              <p className="text-green-600">This DID has a valid Aadhaar ZK proof on-chain</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-xs font-semibold text-gray-500 mb-1">🆔 DECENTRALIZED IDENTIFIER</p>
              <code className="text-xs text-blue-600 break-all block">{did}</code>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-xs font-semibold text-gray-500 mb-1">📅 VERIFICATION DATE</p>
              <p className="text-sm font-mono text-gray-700">{credential.timestamp}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-xs font-semibold text-gray-500 mb-1">🔐 CREDENTIAL HASH</p>
              <code className="text-xs text-gray-700 break-all block">{credential.vcHash}</code>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-xs font-semibold text-gray-500 mb-1">✅ STATUS</p>
              <div className="flex items-center">
                {credential.isValid ? (
                  <>
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-sm font-bold text-green-700">Valid & Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-sm font-bold text-red-700">Revoked</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-inner">
            <div className="flex items-start">
              <span className="text-3xl mr-4">🔗</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">Zero-Knowledge Proof Verification</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>✓ Aadhaar Verified</strong> - Identity confirmed via cryptographic proof</p>
                  <p><strong>✓ Privacy Preserved</strong> - No personal data revealed on-chain</p>
                  <p><strong>✓ Blockchain Secured</strong> - Tamper-proof storage on Ethereum</p>
                  <p><strong>✓ Re-verification Not Required</strong> - Proof remains valid</p>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-xs text-green-800">
                    <strong>🔐 DID ↔ ZK Proof Link Confirmed:</strong> This decentralized identifier is cryptographically linked to a valid Anon Aadhaar zero-knowledge proof stored on the blockchain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <a 
          href="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
          ← Back to Verification
        </a>
      </div>
    </div>
  );
}

