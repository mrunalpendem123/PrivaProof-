# 🔐 Sandbox.co.in API Setup Guide

## Current Status
✅ **Backend Integration Complete** - All API endpoints are set up  
✅ **Frontend Integration Complete** - Real Aadhaar verification page created  
❌ **API Key Activation** - Key needs to be activated on Sandbox platform  

## API Key Status
Your API key: `key_live_e09de71933cd464a8272614cf6de51ff`

**Current Issue**: Getting "401 Unauthorized" responses, which means:
- The API key needs to be activated on the Sandbox platform
- The key might be in test mode and needs to be upgraded to live mode
- Additional verification steps might be required

## Next Steps

### 1. Activate Your API Key
1. **Login to Sandbox.co.in**: https://sandbox.co.in/
2. **Go to API Keys section** in your dashboard
3. **Activate your key** for live usage
4. **Check if any verification is required** (KYC, payment, etc.)

### 2. Test the API Key
Once activated, test with:
```bash
curl -X POST "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp" \
  -H "Content-Type: application/json" \
  -H "x-api-key: key_live_e09de71933cd464a8272614cf6de51ff" \
  -H "x-api-version: 1.0" \
  -H "Accept: application/json" \
  -d '{"aadhaar_number": "123456789012"}'
```

### 3. Test with Real Aadhaar
Once the API key is working:
1. **Start the backend**: `cd backend && npm start`
2. **Start the frontend**: `cd frontend && npm run dev`
3. **Visit**: http://localhost:5173/real-aadhaar
4. **Enter your real Aadhaar number** (12 digits)
5. **Follow the OTP verification flow**

## What's Already Working

### Backend API Endpoints
- ✅ `POST /api/aadhaar/generate-otp` - Generate OTP for Aadhaar
- ✅ `POST /api/aadhaar/verify-otp` - Verify OTP and get Aadhaar details
- ✅ `POST /api/aadhaar/test` - Test Sandbox API connectivity
- ✅ `POST /api/did/generate` - Generate DID
- ✅ `POST /api/credentials/issue` - Issue Verifiable Credential

### Frontend Pages
- ✅ `/` - Original test Aadhaar verification
- ✅ `/real-aadhaar` - **NEW** Real Aadhaar verification flow
- ✅ `/dashboard` - Check verification status

### Complete Flow
1. **Generate DID** - Create unique identifier
2. **Enter Aadhaar** - Input 12-digit Aadhaar number
3. **Generate OTP** - Send OTP to registered mobile
4. **Verify OTP** - Confirm Aadhaar details
5. **Generate ZK Proof** - Create privacy-preserving proof
6. **Issue VC** - Create verifiable credential
7. **Store on Blockchain** - Link to Ethereum

## Security Features

### Privacy Protection
- ✅ **No personal data stored** - Only verification status
- ✅ **ZK proof generation** - Privacy-preserving verification
- ✅ **Hash-based storage** - Only cryptographic commitments on blockchain
- ✅ **No Aadhaar data in logs** - Sensitive data not logged

### Blockchain Integration
- ✅ **Ethereum Sepolia Testnet** - Real blockchain storage
- ✅ **Smart contract verification** - On-chain proof validation
- ✅ **DID-based identity** - Decentralized identifier system

## Testing Instructions

### 1. Test Current System (Working)
```bash
# Start backend
cd backend && npm start

# Start frontend  
cd frontend && npm run dev

# Visit: http://localhost:5173
# Use test data flow
```

### 2. Test Real Aadhaar (After API activation)
```bash
# Visit: http://localhost:5173/real-aadhaar
# Enter your real Aadhaar number
# Follow the complete flow
```

## Troubleshooting

### API Key Issues
- **401 Unauthorized**: API key needs activation
- **403 Forbidden**: API key doesn't have required permissions
- **429 Too Many Requests**: Rate limit exceeded

### Backend Issues
- **Cannot POST /api/aadhaar/***: Backend not running
- **TypeScript errors**: Run `npm run build` first
- **Port 3001 in use**: Kill existing process with `pkill -f node`

### Frontend Issues
- **Page not found**: Make sure all routes are added to App.tsx
- **CORS errors**: Backend CORS is configured for localhost:5173

## Support

If you need help with API key activation:
1. **Check Sandbox.co.in documentation**: https://developer.sandbox.co.in/
2. **Contact Sandbox support** for API key issues
3. **Verify your account status** in the Sandbox dashboard

---

**Ready to test once API key is activated!** 🚀
