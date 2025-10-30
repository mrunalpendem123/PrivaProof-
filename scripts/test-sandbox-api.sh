#!/bin/bash

echo "🧪 Testing Sandbox.co.in Aadhaar OKYC API"
echo "=========================================="

# Test Aadhaar number from their docs
TEST_AADHAAR="123456789012"

echo ""
echo "📞 Step 1: Testing OTP Generation..."
echo "Endpoint: https://api.sandbox.co.in/kyc/aadhaar/okyc/otp"
echo "Test Aadhaar: $TEST_AADHAAR"
echo ""

# Generate OTP (requires API key - will test without first to see response)
RESPONSE=$(curl -s -X POST "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d "{\"aadhaar_number\": \"$TEST_AADHAAR\"}")

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if we need API key
if echo "$RESPONSE" | grep -q "api_key\|authentication\|unauthorized"; then
  echo "⚠️  API requires authentication (API key needed)"
  echo ""
  echo "📋 To get API key:"
  echo "1. Sign up at: https://sandbox.co.in/"
  echo "2. Get free trial API key"
  echo "3. Add to request headers: x-api-key: YOUR_KEY"
else
  echo "✅ API accessible (or returned error message)"
fi

echo ""
echo "🔗 API Documentation: https://developer.sandbox.co.in/reference/aadhaar-okyc-generate-otp-api"
echo "🏠 Sign up: https://sandbox.co.in/"
