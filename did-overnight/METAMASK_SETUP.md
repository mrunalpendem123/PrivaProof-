# 🦊 MetaMask Setup for Local Development

## ⚠️ **CRITICAL: You're on the Wrong Network!**

Your transaction went to **Block #23685306** (public network) but your local Hardhat is on **Block #6**.

**That's why the Dashboard can't find your DID - it's stored on a different blockchain!**

## ✅ **Fix: Connect MetaMask to Localhost**

### **Step 1: Add Localhost Network**

1. Open **MetaMask**
2. Click the network dropdown (top left, shows current network)
3. Click **"Add Network"** or **"Add a network manually"**

### **Step 2: Enter These Settings**

**Network Name:** `Localhost 8545`
**RPC URL:** `http://localhost:8545`
**Chain ID:** `31337`
**Currency Symbol:** `ETH`

### **Step 3: Save and Switch**

1. Click **"Save"**
2. Switch to **"Localhost 8545"** network
3. You should see Chain ID: 31337

## 🔍 **Verify It's Working**

After switching networks:
1. Go to http://localhost:5173
2. Click "Store on Blockchain"
3. **Check the console** - you should see:
   ```
   🌐 Connected network: { chainId: "31337", name: "unknown" }
   ```
4. **Check block number** - Should be low (like Block #7, #8, etc.), NOT millions!

## 🎯 **Now Try Again**

1. **Switch MetaMask to Localhost 8545** (Chain ID 31337)
2. **Complete the flow**: Generate DID → Skip Anon Aadhaar → Issue VC → Store on Blockchain
3. **Go to Dashboard** and verify
4. **Should work now!** ✅

## 🔧 **Alternative: Auto-Switch Network**

The app will now **automatically detect** if you're on the wrong network and show an alert.

## ⚠️ **Important Notes**

- **Localhost network** only exists while Hardhat node is running
- **No real ETH needed** - Hardhat gives you test accounts with 10000 ETH
- **Contracts only exist** on localhost - not on mainnet/testnet
- **If you restart Hardhat**, you'll need to redeploy contracts

**Switch MetaMask to Localhost 8545 and try again!** 🚀
