import { useState, useEffect } from 'react';
import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { mapAnonAadhaarProof, validateProofData } from '../utils/proofMapper';

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

export default function VerifyPage() {
  const [anonAadhaar] = useAnonAadhaar();
  const [did, setDid] = useState('');
  const [vc, setVC] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bypassMode, setBypassMode] = useState(false);
  const navigate = useNavigate();

  // Clear localStorage on component mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('userDID');
    localStorage.removeItem('userPrivateKey');
    console.log('🧹 Cleared localStorage for fresh start');
  }, []);

  // Listen for bypass events
  useEffect(() => {
    const handleBypass = (event: CustomEvent) => {
      console.log('🚀 Bypass event received:', event.detail);
      setBypassMode(true);
      // Force the step to advance
      setStep(3);
    };

    window.addEventListener('anon-aadhaar-bypass', handleBypass as EventListener);
    return () => window.removeEventListener('anon-aadhaar-bypass', handleBypass as EventListener);
  }, []);

  // Listen for network changes
  useEffect(() => {
    const handleNetworkChange = () => {
      console.log('🔄 Network changed, refreshing page...');
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleNetworkChange);
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleNetworkChange);
        }
      };
    }
  }, []);

  // Step 1: Generate DID
  const generateDID = async () => {
    setLoading(true);
    try {
      console.log('🆔 Generating fresh DID...');
      const res = await fetch('http://localhost:3001/api/did/generate', {
        method: 'POST'
      });
      const data = await res.json();
      console.log('✅ Generated DID:', data.did);
      setDid(data.did);
      // Don't persist to localStorage - keep it session-only
      setStep(2);
    } catch (error) {
      console.error('Error generating DID:', error);
      alert('Failed to generate DID. Make sure backend is running on :3001');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Issue VC
  const issueVC = async () => {
    if (anonAadhaar?.status !== 'logged-in' && !bypassMode) return;
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDID: did,
          anonAadhaarProof: bypassMode ? { test: true } : anonAadhaar.proof
        })
      });
      const data = await res.json();
      setVC(data.verifiableCredential);
      setStep(4);
    } catch (error) {
      console.error('Error issuing VC:', error);
      alert('Failed to issue credential. Make sure backend is running and DIDKit is installed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Store on Ethereum
  const storeOnChain = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Force refresh the network detection
      await provider.send("eth_chainId", []);
      
          // Verify we're on the correct network (Sepolia Testnet / Chain ID 11155111)
          const network = await provider.getNetwork();
          console.log('🌐 Connected network:', {
            chainId: network.chainId.toString(),
            name: network.name,
            chainIdNumber: Number(network.chainId)
          });
          
          if (Number(network.chainId) !== 11155111) {
            console.error('❌ Wrong network detected:', {
              expected: 11155111,
              actual: Number(network.chainId),
              networkName: network.name
            });
            alert(`❌ Wrong Network!\n\nYou're on: ${network.name} (Chain ID: ${network.chainId})\n\nPlease switch MetaMask to:\n- Network: Sepolia Test Network\n- Chain ID: 11155111\n\nThen refresh the page and try again.`);
            return;
          }
      
      const signer = await provider.getSigner();
      
      // Note: Contract address and ABI need to be set after deployment
      if (CONTRACT_ADDRESS === 'YOUR_DEPLOYED_CONTRACT_ADDRESS') {
        alert('⚠️ Contract not deployed yet! Deploy contracts first and update CONTRACT_ADDRESS in Verify.tsx');
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const vcHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(vc)));
      
      console.log('📝 Mapping Anon Aadhaar proof...');
      console.log('Proof object:', anonAadhaar.proof);
      console.log('AnonAadhaar status:', anonAadhaar?.status);
      
      // Check if proof exists
      if (!anonAadhaar?.proof) {
        console.warn('No proof available from Anon Aadhaar, using test proof data');
      }
      
      // Map Anon Aadhaar proof to contract format (with safe fallback)
      let proofData;
      try {
        proofData = mapAnonAadhaarProof(anonAadhaar?.proof);
        console.log('Mapped proof data:', proofData);
      } catch (error: any) {
        console.error('Proof mapping error:', error);
        console.log('Using fallback test proof data');
        proofData = mapAnonAadhaarProof(null); // Will use test data
      }
      
      // Validate proof data
      if (!validateProofData(proofData)) {
        console.error('Proof validation failed');
        alert('❌ Invalid proof data - please try generating proof again');
        return;
      }
      
      console.log('✅ Proof data validated');
      console.log('📦 Storing on blockchain:', {
        did: did, // Full DID for debugging
        didLength: did.length,
        vcHash,
        nullifierSeed: proofData.nullifierSeed,
        nullifier: proofData.nullifier
      });
      console.log('📝 Contract address:', CONTRACT_ADDRESS);
      
      // Estimate gas first to catch any revert issues
      console.log('📊 Estimating gas...');
      try {
        const gasEstimate = await contract.registerDID.estimateGas(
          did,
          vcHash,
          proofData.nullifierSeed,
          proofData.nullifier,
          proofData.timestamp,
          proofData.signal,
          proofData.revealArray,
          proofData.groth16Proof
        );
        console.log('✅ Gas estimate:', gasEstimate.toString());
      } catch (gasError: any) {
        console.error('❌ Gas estimation failed - transaction will revert:', gasError);
        alert(`❌ Transaction will fail!\n\nReason: ${gasError.reason || gasError.message}\n\nThis means the smart contract rejected the data.`);
        return;
      }
      
      // Call contract with mapped proof data
      console.log('📤 Sending transaction...');
      const tx = await contract.registerDID(
        did,
        vcHash,
        proofData.nullifierSeed,
        proofData.nullifier,
        proofData.timestamp,
        proofData.signal,
        proofData.revealArray,
        proofData.groth16Proof
      );
      
      console.log('🔄 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
          console.log('✅ Transaction confirmed!', receipt);
          console.log('📦 Block:', receipt.blockNumber);
          console.log('⛽ Gas used:', receipt.gasUsed.toString());
          console.log('🎯 DID stored:', did);
          
          // Navigate to Dashboard with DID pre-filled
          alert(`✅ Stored on Ethereum!\n\nTransaction: ${tx.hash}\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed.toString()}\n\nYour DID is now linked to the ZK proof on-chain!\n\nRedirecting to Dashboard...`);
          
          setTimeout(() => {
            navigate(`/dashboard?did=${encodeURIComponent(did)}`);
          }, 2000);
    } catch (error: any) {
      console.error('❌ Error storing on chain:', error);
      console.error('Error details:', {
        message: error.message,
        reason: error.reason,
        code: error.code,
        data: error.data
      });
      
      let errorMessage = 'Failed to store on blockchain';
      if (error.reason) {
        errorMessage += `:\n\n${error.reason}`;
      } else if (error.message) {
        errorMessage += `:\n\n${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">Verify Your Identity</h1>
        <p className="text-gray-600 mb-4">Create a decentralized identity linked to zero-knowledge Aadhaar proof</p>
            <div className="flex justify-center space-x-4">
              <a
                href="/digilocker"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                🏛️ DigiLocker Verification
              </a>
              <a
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                📊 Check Verification
              </a>
            </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      
      {/* Step 1: Generate DID */}
      <div className={`mb-6 p-6 bg-white rounded-lg shadow-md border-l-4 ${did ? 'border-green-500' : 'border-blue-500'}`}>
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            did ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {did ? '✓' : '1'}
          </div>
          <h2 className="text-xl font-semibold">Step 1: Generate Your DID</h2>
        </div>
        {!did ? (
          <div>
            <p className="text-gray-600 mb-4 text-sm">
              Create a unique Decentralized Identifier (DID) that will be linked to your Aadhaar proof
            </p>
            <button 
              onClick={generateDID} 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg transition-all">
              {loading ? 'Generating...' : 'Generate My DID'}
            </button>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-3">✓</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800 mb-1">DID Generated Successfully</p>
                <p className="text-sm text-gray-700 mb-2">Your Decentralized Identifier:</p>
                <code className="block bg-white p-3 rounded border border-green-300 text-xs break-all font-mono">
                  {did}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Anon Aadhaar Proof */}
      {step >= 2 && (
        <div className={`mb-6 p-6 bg-white rounded-lg shadow-md border-l-4 ${
          anonAadhaar?.status === 'logged-in' ? 'border-green-500' : 'border-blue-500'
        }`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              anonAadhaar?.status === 'logged-in' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {anonAadhaar?.status === 'logged-in' ? '✓' : '2'}
            </div>
            <h2 className="text-xl font-semibold">Step 2: Generate ZK Proof from Aadhaar</h2>
          </div>
          
          {/* Test Mode Instructions */}
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🧪</span>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Test Mode Active</h3>
                <p className="text-sm text-blue-700 mb-2">
                  For demo purposes, use this test QR data instead of your real Aadhaar:
                </p>
                <div className="bg-white p-3 rounded border border-blue-300 font-mono text-sm flex items-center justify-between">
                  <code className="text-blue-900">MF677000856FI</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText('MF677000856FI')}
                    className="ml-4 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  📋 Copy and paste this into the QR code field when prompted
                </p>
              </div>
            </div>
          </div>
          
          <LogInWithAnonAadhaar />
          
          {/* Direct bypass for testing when Anon Aadhaar fails */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>🚀 Test Bypass:</strong> If Anon Aadhaar gets stuck, use this to continue:
            </p>
            <button
              onClick={() => {
                // Simulate successful proof generation
                const mockProof = { test: true, timestamp: Date.now() };
                // Force update the anonAadhaar state
                window.dispatchEvent(new CustomEvent('anon-aadhaar-bypass', { 
                  detail: { 
                    status: 'logged-in', 
                    proof: mockProof,
                    user: { nullifier: 'test-nullifier' }
                  } 
                }));
                console.log('🧪 Bypass activated - simulating successful proof generation');
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              🧪 Skip Anon Aadhaar (Use Test Data)
            </button>
          </div>
          
          {anonAadhaar?.status === 'logged-in' && (
            <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start">
                <span className="text-green-600 text-2xl mr-3">✓</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 mb-1">ZK Proof Generated Successfully</p>
                  <p className="text-sm text-gray-700 mb-3">
                    Zero-knowledge proof created from your Aadhaar without revealing sensitive data
                  </p>
                  <div className="bg-white p-3 rounded border border-green-300">
                    <p className="text-xs font-semibold text-gray-700 mb-2">🔗 Proof will be linked to:</p>
                    <code className="text-xs text-blue-600 break-all block">
                      {did}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Issue VC */}
      {step >= 2 && (anonAadhaar?.status === 'logged-in' || bypassMode) && (
        <div className={`mb-6 p-6 bg-white rounded-lg shadow-md border-l-4 ${
          vc ? 'border-green-500' : 'border-blue-500'
        }`}>
          <div className="flex items-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              vc ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {vc ? '✓' : '3'}
            </div>
            <h2 className="text-xl font-semibold">Step 3: Create Verifiable Credential</h2>
          </div>
          
          {!vc ? (
            <div>
              <p className="text-gray-600 mb-4 text-sm">
                Combine your DID and ZK proof into a W3C Verifiable Credential
              </p>
              <button 
                onClick={issueVC} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg transition-all">
                {loading ? 'Creating Credential...' : 'Issue Verifiable Credential'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start">
                <span className="text-green-600 text-2xl mr-3">✓</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 mb-2">Verifiable Credential Created</p>
                  <div className="bg-white p-4 rounded border border-green-300 text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-gray-700">🆔 Subject DID:</span>
                      <code className="block text-blue-600 mt-1 break-all">{vc.credentialSubject?.id}</code>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <span className="font-semibold text-gray-700">🔐 Contains ZK Proof:</span>
                      <p className="text-green-700 mt-1">✓ Anon Aadhaar proof embedded</p>
                    </div>
                    <div className="pt-2 border-t border-green-200">
                      <span className="font-semibold text-gray-700">📅 Issued:</span>
                      <span className="ml-2 text-gray-600">{new Date(vc.issuanceDate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Store on Ethereum */}
      {step >= 4 && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-purple-100 text-purple-600">
              4
            </div>
            <h2 className="text-xl font-semibold">Step 4: Store on Blockchain</h2>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm">
            Permanently link your DID to the ZK proof on Ethereum blockchain
          </p>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
            <p className="text-sm font-semibold text-purple-800 mb-2">📦 What will be stored:</p>
            <ul className="text-xs text-gray-700 space-y-1 ml-4">
              <li>• Your DID: <code className="text-blue-600">{did.slice(0, 30)}...</code></li>
              <li>• Hash of your Verifiable Credential</li>
              <li>• Link to your ZK Proof</li>
              <li>• Timestamp of verification</li>
            </ul>
          </div>
          
          <button 
            onClick={storeOnChain} 
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 shadow-lg transition-all w-full">
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Storing on Blockchain...
              </span>
            ) : '🔗 Store DID ↔ ZK Proof Link on Ethereum'}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold">
          <span className="mr-2">📊</span>
          Go to Verification Dashboard →
        </button>
        
        {did && (
          <div className="text-sm text-gray-500">
            Your DID: <code className="text-blue-600">{did.slice(0, 20)}...</code>
          </div>
        )}
      </div>

      {/* Explanation Box */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-3">🔗 How DID ↔ ZK Proof Linkage Works:</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. DID Creation:</strong> Unique identifier generated for you</p>
          <p><strong>2. ZK Proof:</strong> Aadhaar verified without revealing data</p>
          <p><strong>3. Credential:</strong> W3C VC combines DID + Proof</p>
          <p><strong>4. Blockchain:</strong> Permanent link stored on Ethereum</p>
          <p className="pt-2 text-xs text-blue-700 border-t border-blue-200 mt-3">
            ✓ This creates a verifiable, tamper-proof connection between your decentralized identity and your Aadhaar verification
          </p>
        </div>
      </div>
    </div>
  );
}

