import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { mapAnonAadhaarProof, validateProofData } from '../utils/proofMapper';

// Contract address and ABI from deployment
const CONTRACT_ADDRESS = '0xC3372161Ba52efe386955a3Fb221F2269039228a'; // Sepolia deployed address
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "did", "type": "string"},
      {"internalType": "bytes32", "name": "vcHash", "type": "bytes32"},
      {"internalType": "uint256", "name": "nullifierSeed", "type": "uint256"},
      {"internalType": "uint256", "name": "nullifier", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "signal", "type": "uint256"},
      {"internalType": "uint256[4]", "name": "revealArray", "type": "uint256[4]"},
      {"internalType": "uint256[8]", "name": "groth16Proof", "type": "uint256[8]"}
    ],
    "name": "registerDID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "did", "type": "string"}],
    "name": "getCredential",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "vcHash", "type": "bytes32"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "bool", "name": "isValid", "type": "bool"}
        ],
        "internalType": "struct DIDRegistry.Credential",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface DigiLockerVerificationState {
  step: number;
  sessionId: string;
  sessionStatus: string;
  verified: boolean;
  zkProof: any;
  did: string;
  vc: any;
  loading: boolean;
  error: string;
  serviceMode: string;
}

export default function DigiLockerVerify() {
  const [state, setState] = useState<DigiLockerVerificationState>({
    step: 1,
    sessionId: '',
    sessionStatus: '',
    verified: false,
    zkProof: null,
    did: '',
    vc: null,
    loading: false,
    error: '',
    serviceMode: 'unknown'
  });

  const navigate = useNavigate();

  // Clear localStorage on component mount
  useEffect(() => {
    localStorage.removeItem('userDID');
    localStorage.removeItem('userPrivateKey');
    console.log('🧹 Cleared localStorage for fresh start');
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
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      console.log('🆔 Generating fresh DID...');
      const res = await fetch('http://localhost:3001/api/did/generate', {
        method: 'POST'
      });
      const data = await res.json();
      console.log('✅ Generated DID:', data.did);
      setState(prev => ({ ...prev, did: data.did, step: 2, loading: false }));
    } catch (error) {
      console.error('Error generating DID:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate DID. Make sure backend is running on :3001',
        loading: false 
      }));
    }
  };

  // Step 2: Initiate DigiLocker Session
  const initiateDigiLockerSession = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      console.log('📱 Initiating DigiLocker session...');
      const res = await fetch('http://localhost:3001/api/digilocker/initiate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log('✅ DigiLocker session initiated:', data);
        setState(prev => ({ 
          ...prev, 
          sessionId: data.result.session_id,
          step: 3,
          loading: false 
        }));
      } else {
        throw new Error(data.error || 'Failed to initiate DigiLocker session');
      }
    } catch (error: any) {
      console.error('Error initiating DigiLocker session:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to initiate DigiLocker session: ${error.message}`,
        loading: false 
      }));
    }
  };

  // Step 3: Check Session Status
  const checkSessionStatus = async () => {
    if (!state.sessionId) {
      setState(prev => ({ ...prev, error: 'No session ID available' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      console.log('🔍 Checking DigiLocker session status:', state.sessionId);
      const res = await fetch(`http://localhost:3001/api/digilocker/session-status/${state.sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log('✅ Session status:', data);
        setState(prev => ({ 
          ...prev, 
          sessionStatus: data.result.status,
          loading: false 
        }));
        
        if (data.result.status === 'completed') {
          setState(prev => ({ ...prev, step: 4 }));
        }
      } else {
        throw new Error(data.error || 'Failed to check session status');
      }
    } catch (error: any) {
      console.error('Error checking session status:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to check session status: ${error.message}`,
        loading: false 
      }));
    }
  };

  // Step 4: Verify Aadhaar
  const verifyAadhaar = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      console.log('🔐 Verifying Aadhaar via DigiLocker...');
      const res = await fetch('http://localhost:3001/api/digilocker/verify-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (data.success && data.verified) {
        console.log('✅ Aadhaar verified successfully:', data);
        setState(prev => ({ 
          ...prev, 
          verified: true,
          zkProof: data.zkProof,
          serviceMode: data.mode || 'unknown',
          step: 5,
          loading: false 
        }));
      } else {
        throw new Error(data.error || 'Aadhaar verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying Aadhaar:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Aadhaar verification failed: ${error.message}`,
        loading: false 
      }));
    }
  };

  // Step 5: Issue VC
  const issueVC = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetch('http://localhost:3001/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userDID: state.did,
          anonAadhaarProof: state.zkProof
        })
      });
      const data = await res.json();
      setState(prev => ({ ...prev, vc: data.verifiableCredential, step: 6, loading: false }));
    } catch (error: any) {
      console.error('Error issuing VC:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to issue credential: ${error.message}`,
        loading: false 
      }));
    }
  };

  // Step 6: Store on Ethereum
  const storeOnChain = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Verify we're on the correct network (Sepolia Testnet / Chain ID 11155111)
      const network = await provider.getNetwork();
      console.log('🌐 Connected network:', {
        chainId: network.chainId.toString(),
        name: network.name,
        chainIdNumber: Number(network.chainId)
      });
      
      if (Number(network.chainId) !== 11155111) {
        throw new Error(`❌ Wrong Network!\n\nYou're on: ${network.name} (Chain ID: ${network.chainId})\n\nPlease switch MetaMask to:\n- Network: Sepolia Test Network\n- Chain ID: 11155111\n\nThen refresh the page and try again.`);
      }
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const vcHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(state.vc)));
      
      console.log('📝 Mapping ZK proof...');
      const proofData = mapAnonAadhaarProof(state.zkProof);
      
      if (!validateProofData(proofData)) {
        throw new Error('❌ Invalid proof data - please try generating proof again');
      }
      
      console.log('📦 Storing on blockchain:', {
        did: state.did,
        vcHash,
        nullifierSeed: proofData.nullifierSeed,
        nullifier: proofData.nullifier
      });
      
      // Estimate gas
      const gasEstimate = await contract.registerDID.estimateGas(
        state.did,
        vcHash,
        proofData.nullifierSeed,
        proofData.nullifier,
        proofData.timestamp,
        proofData.signal,
        proofData.revealArray,
        proofData.groth16Proof
      );
      console.log('✅ Gas estimate:', gasEstimate.toString());
      
      // Send transaction
      const tx = await contract.registerDID(
        state.did,
        vcHash,
        proofData.nullifierSeed,
        proofData.nullifier,
        proofData.timestamp,
        proofData.signal,
        proofData.revealArray,
        proofData.groth16Proof
      );
      
      console.log('🔄 Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!', receipt);
      
      // Navigate to Dashboard with DID pre-filled
      alert(`✅ Stored on Ethereum!\n\nTransaction: ${tx.hash}\nBlock: ${receipt.blockNumber}\nGas Used: ${receipt.gasUsed.toString()}\n\nYour DID is now linked to the ZK proof on-chain!\n\nRedirecting to Dashboard...`);
      
      setTimeout(() => {
        navigate(`/dashboard?did=${encodeURIComponent(state.did)}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error storing on chain:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to store on blockchain',
        loading: false 
      }));
    }
  };

  const resetFlow = () => {
    setState({
      step: 1,
      sessionId: '',
      sessionStatus: '',
      verified: false,
      zkProof: null,
      did: '',
      vc: null,
      loading: false,
      error: '',
      serviceMode: 'unknown'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏛️ DigiLocker Aadhaar Verification
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Verify your Aadhaar via DigiLocker → Generate ZK Proof → Link to DID → Store on Blockchain
          </p>
          {state.serviceMode !== 'unknown' && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              state.serviceMode === 'digilocker' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {state.serviceMode === 'digilocker' ? '🏛️' : '🔄'} 
              {state.serviceMode === 'digilocker' ? ' DigiLocker Mode' : ' Simulation Mode'}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  state.step >= stepNum 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 6 && (
                  <div className={`w-16 h-1 mx-2 ${
                    state.step > stepNum ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Generate DID</span>
            <span>Initiate Session</span>
            <span>Check Status</span>
            <span>Verify Aadhaar</span>
            <span>Issue VC</span>
            <span>Store on Chain</span>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700 whitespace-pre-line">
                  {state.error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {state.step === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Generate DID</h2>
              <p className="text-gray-600 mb-6">
                First, let's generate a unique Decentralized Identifier (DID) for you.
              </p>
              <button
                onClick={generateDID}
                disabled={state.loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                {state.loading ? 'Generating...' : 'Generate DID'}
              </button>
            </div>
          )}

          {state.step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Initiate DigiLocker Session</h2>
              <p className="text-gray-600 mb-6">
                Start a DigiLocker session to verify your Aadhaar document.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">DigiLocker Integration</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      This will create a secure session with DigiLocker for Aadhaar verification.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={initiateDigiLockerSession}
                  disabled={state.loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {state.loading ? 'Initiating...' : 'Initiate DigiLocker Session'}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 1 }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: Check Session Status</h2>
              <p className="text-gray-600 mb-6">
                Check if the DigiLocker session is ready for verification.
              </p>
              {state.sessionId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-gray-400">🔑</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800">Session ID</h3>
                      <div className="mt-2 text-sm text-gray-700 font-mono">
                        {state.sessionId}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex space-x-4">
                <button
                  onClick={checkSessionStatus}
                  disabled={state.loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {state.loading ? 'Checking...' : 'Check Session Status'}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 2 }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {state.step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 4: Verify Aadhaar</h2>
              <p className="text-gray-600 mb-6">
                Verify your Aadhaar document through DigiLocker.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-400">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Session Ready</h3>
                    <div className="mt-2 text-sm text-green-700">
                      DigiLocker session is ready for Aadhaar verification.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={verifyAadhaar}
                  disabled={state.loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {state.loading ? 'Verifying...' : 'Verify Aadhaar'}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 3 }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {state.step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 5: Issue Verifiable Credential</h2>
              <p className="text-gray-600 mb-6">
                Great! Your Aadhaar has been verified via DigiLocker. Now let's create a privacy-preserving credential.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-400">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Aadhaar Verified via DigiLocker</h3>
                    <div className="mt-2 text-sm text-green-700">
                      Your Aadhaar has been successfully verified and a ZK proof has been generated.
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={issueVC}
                  disabled={state.loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {state.loading ? 'Issuing VC...' : 'Issue Verifiable Credential'}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 4 }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {state.step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 6: Store on Blockchain</h2>
              <p className="text-gray-600 mb-6">
                Finally, let's store your verified credential on the Ethereum blockchain for permanent verification.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">📋</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Ready to Store</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      Your DID: <code className="bg-blue-100 px-2 py-1 rounded">{state.did}</code>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={storeOnChain}
                  disabled={state.loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                >
                  {state.loading ? 'Storing on Blockchain...' : 'Store on Ethereum'}
                </button>
                <button
                  onClick={() => setState(prev => ({ ...prev, step: 5 }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="text-center mt-6">
          <button
            onClick={resetFlow}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
