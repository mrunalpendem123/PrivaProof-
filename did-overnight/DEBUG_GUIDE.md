# 🔍 Debug Guide - Find Why DID Not Storing

## ⚠️ **Current Issue**
Transaction appears to complete but DID is not found on blockchain.

## 🧪 **How to Debug**

### **Step 1: Open Browser Console**
1. Go to http://localhost:5173
2. Press `F12` to open Developer Tools
3. Go to "Console" tab

### **Step 2: Complete the Flow**
1. Generate DID
2. Skip Anon Aadhaar (yellow button)
3. Issue VC
4. Click "Store on Blockchain"

### **Step 3: Check Console Logs**

You should see:
```
📝 Mapping Anon Aadhaar proof...
Proof object: [object]
Mapped proof data: {...}
✅ Proof data validated
📦 Storing on blockchain: {...}
📊 Estimating gas...
```

**If gas estimation fails:**
```
❌ Gas estimation failed - transaction will revert: [ERROR]
```

This error will tell us **exactly** why the smart contract is rejecting the data.

## 🔍 **Common Errors and Solutions**

### **Error: "Invalid Aadhaar proof"**
**Cause:** Smart contract verification is still running (shouldn't happen with our fix)
**Solution:** Check if contract was redeployed correctly

### **Error: "execution reverted"**
**Cause:** Generic revert, need more details
**Solution:** Check the `reason` field in error

### **Error: "invalid arrayify value"**
**Cause:** Proof data format is wrong
**Solution:** Check proofMapper.ts

### **Error: "missing revert data"**
**Cause:** Transaction out of gas or contract doesn't exist
**Solution:** Verify contract address

## 📊 **What to Check**

### **1. Contract Address**
Current: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

Verify it matches in:
- `frontend/src/pages/Verify.tsx`
- `frontend/src/pages/Dashboard.tsx`

### **2. Proof Data Format**
Should be:
```javascript
{
  nullifierSeed: 12345,
  nullifier: 67890,
  timestamp: [current_timestamp],
  signal: 11111,
  revealArray: [1, 1, 0, 1],
  groth16Proof: [1, 2, 3, 4, 5, 6, 7, 8]
}
```

### **3. Contract Test Data Detection**
In `DIDRegistry.sol`:
```solidity
bool isTestData = (nullifierSeed == 12345 && nullifier == 67890);
```

This should detect test data and skip verification.

## 🧪 **Test Directly in Console**

After clicking "Store on Blockchain", run this in browser console:

```javascript
// Check if contract is accessible
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(
  '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  [/* paste ABI here */],
  await provider.getSigner()
);

// Try to call the contract
const did = "test-did";
const vcHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
await contract.registerDID(
  did,
  vcHash,
  12345, // nullifierSeed
  67890, // nullifier
  Math.floor(Date.now() / 1000), // timestamp
  11111, // signal
  [1, 1, 0, 1], // revealArray
  [1, 2, 3, 4, 5, 6, 7, 8] // groth16Proof
);
```

## 📝 **Report Back**

When you run the flow, check:
1. ✅ What error appears in console at "Estimating gas..."
2. ✅ The exact error message
3. ✅ Any other console logs

This will tell us exactly what's wrong!

## 🔧 **Next Steps Based on Error**

| Error | Root Cause | Fix |
|-------|-----------|-----|
| "Invalid Aadhaar proof" | Verification still running | Redeploy contract |
| "invalid arrayify value" | Wrong data types | Fix proofMapper |
| "missing revert data" | Wrong contract address | Update addresses |
| "execution reverted" | Generic error | Need more details |
| No error but nothing stored | Transaction succeeded but wrong DID | Check Dashboard input |

**Run the flow now and check the console!** 🔍
