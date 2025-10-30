# 🔐 Sandbox.co.in Aadhaar API Integration Guide

## ✅ API Status: WORKING & ACCESSIBLE

The Sandbox Aadhaar OKYC API is **live and responding**. We confirmed:
- Endpoint is accessible
- Returns proper HTTP responses
- Requires API authentication

---

## 📋 **How to Get Started**

### **Step 1: Sign Up**
1. Go to: https://sandbox.co.in/
2. Click "Start Free Trial" or "Sign Up"
3. Register with email
4. Verify email

### **Step 2: Get API Key**
1. Log into Sandbox dashboard
2. Go to "API Keys" or "Credentials"
3. Generate new API key
4. Copy the key (format: `key_live_xxxxxxxxxx` or similar)

### **Step 3: Test the API**

**Generate OTP:**
```bash
curl -X POST "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "x-api-version: 1.0" \
  -d '{
    "aadhaar_number": "123456789012"
  }'
```

**Expected Response:**
```json
{
  "reference_id": "10683915",
  "message": "OTP sent successfully"
}
```

**Verify OTP:**
```bash
curl -X POST "https://api.sandbox.co.in/kyc/aadhaar/okyc/verify" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "x-api-version: 1.0" \
  -d '{
    "reference_id": "10683915",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "verified": true,
  "name": "John Doe",
  "dob": "01-01-1990",
  "aadhaar_number": "xxxx-xxxx-1234",
  "address": {...}
}
```

---

## 🧪 **Test Credentials (Sandbox)**

According to their documentation, use these **test values**:

**Test Aadhaar Numbers:**
- `123456789012` - Valid Aadhaar
- `234567890123` - Invalid Aadhaar
- `345678901234` - OTP expired

**Test OTPs:**
- `123456` - Valid OTP
- `999999` - Invalid OTP

---

## 💰 **Pricing**

**Free Trial:**
- Usually 50-100 free API calls
- No credit card required
- Good for testing

**Paid Plans:**
- Pay-per-use or subscription
- Check their pricing page: https://sandbox.co.in/pricing

---

## 🛠️ **Integration Flow**

Once you have API key, here's how to integrate:

### **Backend Setup:**
```typescript
// backend/src/services/aadhaar.ts
import axios from 'axios';

const SANDBOX_API_KEY = process.env.SANDBOX_API_KEY;
const SANDBOX_BASE_URL = 'https://api.sandbox.co.in';

export async function generateAadhaarOTP(aadhaarNumber: string) {
  const response = await axios.post(
    `${SANDBOX_BASE_URL}/kyc/aadhaar/okyc/otp`,
    { aadhaar_number: aadhaarNumber },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SANDBOX_API_KEY,
        'x-api-version': '1.0'
      }
    }
  );
  return response.data.reference_id;
}

export async function verifyAadhaarOTP(referenceId: string, otp: string) {
  const response = await axios.post(
    `${SANDBOX_BASE_URL}/kyc/aadhaar/okyc/verify`,
    { reference_id: referenceId, otp: otp },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SANDBOX_API_KEY,
        'x-api-version': '1.0'
      }
    }
  );
  return response.data;
}
```

### **Frontend Flow:**
1. User enters Aadhaar number
2. Call `/api/aadhaar/generate-otp`
3. User enters OTP from SMS
4. Call `/api/aadhaar/verify-otp`
5. Get verification result
6. Generate ZK proof
7. Store on blockchain

---

## ⚠️ **Important Notes**

### **1. API Deprecation Warning**
The Aadhaar OKYC API is marked as **deprecated** in their docs:
> "This API is deprecated and may shut down anytime. Use the DigiLocker API for KYC."

**Recommendation:**
- Use for POC/testing only
- Migrate to DigiLocker API for production
- Or use Anon Aadhaar for privacy-first approach

### **2. Privacy Considerations**
- This API returns **full Aadhaar data** (name, address, photo)
- Not privacy-preserving like ZK proofs
- Consider generating ZK proof immediately and **deleting** personal data
- Only store proof on blockchain, not raw data

### **3. Compliance**
- Ensure compliance with Aadhaar regulations
- Store data securely (if you must store it)
- Follow data minimization principles
- Get user consent

---

## 🎯 **Next Steps**

1. **Sign up** at https://sandbox.co.in/
2. **Get API key** from dashboard
3. **Test with their sandbox** (test Aadhaar numbers)
4. **Integrate** into your backend
5. **Convert to ZK proof** after verification
6. **Store on blockchain** (proof only, not data)

---

## 🔗 **Useful Links**

- **API Docs**: https://developer.sandbox.co.in/reference/aadhaar-okyc-generate-otp-api
- **Sign Up**: https://sandbox.co.in/
- **DigiLocker API** (recommended): https://developer.sandbox.co.in/reference/digilocker-api
- **Pricing**: https://sandbox.co.in/pricing
- **Support**: support@sandbox.co.in

---

## ✅ **Verdict**

The Sandbox Aadhaar OKYC API:
- ✅ **Working** - Confirmed accessible
- ✅ **Real verification** - Uses actual Aadhaar OTP
- ⚠️ **Deprecated** - May shut down
- ❌ **No privacy** - Returns full data
- 💰 **Paid** - After free trial

**Recommendation**: Use for testing, but consider DigiLocker or Anon Aadhaar for production.
