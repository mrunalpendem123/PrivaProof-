import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyPage() {
  const [did, setDid] = useState('');
  const [vc, setVC] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  // Step 1: Simulate KYC/Aadhaar verification
  const verifyKYC = async () => {
    if (!aadhaarNumber || !name) {
      alert('Please enter Aadhaar number and name');
      return;
    }
    setLoading(true);
    try {
      // Simulate KYC verification
      const res = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber, name })
      });
      if (!res.ok) throw new Error('KYC verification failed');
      const data = await res.json();
      console.log('✅ KYC verified:', data);
      setStep(2);
    } catch (error) {
      console.error('KYC error:', error);
      alert('KYC verification failed. Using simulation mode.');
      setStep(2); // Continue anyway in simulation mode
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate DID
  const generateDID = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/did/generate', {
        method: 'POST'
      });
      const data = await res.json();
      console.log('✅ Generated DID:', data.did);
      setDid(data.did);
      setStep(3);
    } catch (error) {
      console.error('Error generating DID:', error);
      alert('Failed to generate DID. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Issue VC + Generate ZK Proof + Publish to iroh
  const publishProfile = async () => {
    if (!did) {
      alert('Generate DID first');
      return;
    }
    if (!username) {
      alert('Enter a username');
      return;
    }
    setLoading(true);
    try {
      // Issue VC
      const vcResp = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDID: did, anonAadhaarProof: { test: true } })
      });
      if (!vcResp.ok) throw new Error('Failed to issue VC');
      const vcData = await vcResp.json();
      setVC(vcData.verifiableCredential);

      // Create BBS+ proof (sign + derive)
      const signResp = await fetch('/api/proof/bbs/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          did, 
          claims: { 
            aadhaar_verified: true,
            timestamp: Date.now()
          } 
        })
      });
      if (!signResp.ok) throw new Error('Failed to sign BBS+');
      const signed = await signResp.json();

      const deriveResp = await fetch('/api/proof/bbs/derive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signed.signature,
          messages: signed.messages,
          disclosure: [true, false, false, false] // Reveal only aadhaar_verified
        })
      });
      if (!deriveResp.ok) throw new Error('Failed to derive BBS+ proof');
      const proofData = await deriveResp.json();

      // Publish to iroh
      const publishResp = await fetch('/api/profile/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.startsWith('@') ? username.slice(1) : username,
          did,
          vc: vcData.verifiableCredential,
          proof: proofData.proof
        })
      });
      if (!publishResp.ok) {
        const errorData = await publishResp.json();
        throw new Error(errorData.error || 'Failed to publish profile');
      }
      const publishResult = await publishResp.json();
      console.log('✅ Published to iroh:', publishResult);

      alert(`✅ Successfully published to iroh network!\n\nUsername: ${username}\nDID: ${did.slice(0, 20)}...`);
      setStep(4);
    } catch (error: any) {
      console.error('Publish error:', error);
      alert(`Failed to publish: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Verify Identity</h1>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className={`flex-1 ${step >= 1 ? 'text-cyan-400' : 'text-gray-600'}`}>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: step >= 1 ? '33%' : '0%' }}
              />
            </div>
            <p className="mt-2 text-sm">1. KYC Verification</p>
          </div>
          <div className={`flex-1 ml-4 ${step >= 2 ? 'text-cyan-400' : 'text-gray-600'}`}>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: step >= 2 ? '33%' : '0%' }}
              />
            </div>
            <p className="mt-2 text-sm">2. Generate DID</p>
          </div>
          <div className={`flex-1 ml-4 ${step >= 3 ? 'text-cyan-400' : 'text-gray-600'}`}>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: step >= 4 ? '33%' : '0%' }}
              />
            </div>
            <p className="mt-2 text-sm">3. Issue VC & Publish</p>
          </div>
        </div>

        {/* Step 1: KYC Verification */}
        {step === 1 && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Step 1: KYC Verification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter Aadhaar number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter full name"
                />
              </div>
              <button
                onClick={verifyKYC}
                disabled={loading}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify KYC'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate DID */}
        {step === 2 && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Step 2: Generate DID</h2>
            <p className="mb-4 text-gray-400">Generate your decentralized identifier</p>
            <button
              onClick={generateDID}
              disabled={loading}
              className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate DID'}
            </button>
            {did && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Your DID:</p>
                <code className="text-cyan-400 break-all">{did}</code>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Issue VC & Publish */}
        {step === 3 && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Step 3: Issue VC & Publish to iroh</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                  placeholder="@username"
                />
              </div>
              <button
                onClick={publishProfile}
                disabled={loading || !username}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Publishing to iroh...' : 'Issue VC & Publish'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-gray-900 rounded-lg p-6 border border-cyan-500">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">✅ Success!</h2>
            <p className="mb-4 text-gray-300">Your identity has been verified and published to the iroh network.</p>
            <div className="space-y-2 mb-6">
              <p className="text-sm"><span className="text-gray-400">Username:</span> <span className="text-cyan-400">@{username}</span></p>
              <p className="text-sm"><span className="text-gray-400">DID:</span> <code className="text-cyan-400 text-xs">{did}</code></p>
            </div>
            <button
              onClick={() => navigate('/verifier')}
              className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold"
            >
              Go to Verifier Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
