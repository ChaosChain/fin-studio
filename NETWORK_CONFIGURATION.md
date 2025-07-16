# Network Configuration Guide

## 🚨 **Important Network Compatibility Notice**

This document explains the network configuration options for your fintech application and clarifies the differences between Ethereum Sepolia and Base Sepolia support.

## **Current Network Support Status**

### ✅ **Fully Supported Networks (x402 + Payment System)**
- **Base Sepolia** (`base-sepolia`) - Layer 2 testnet
- **Base Mainnet** (`base`) - Layer 2 mainnet
- **Avalanche Fuji** (`avalanche-fuji`) - Avalanche testnet
- **Avalanche** (`avalanche`) - Avalanche mainnet
- **IoTeX** (`iotex`) - IoTeX mainnet

### ⚠️ **Partially Supported Networks (Testing Only)**
- **Ethereum Sepolia** (`sepolia`) - Layer 1 testnet
  - ✅ Supported by: Test files (`onchain-payment-test.js`, `simple-balance-check.js`)
  - ❌ **NOT supported** by: x402 protocol, payment middleware, main application

## **Recommended Configuration**

### **Base Sepolia (Primary Choice)**

Your application is configured to use **Base Sepolia** which provides full functionality:

```bash
# Copy the template file
cp env.local.template .env.local

# Edit .env.local with your actual values:
NETWORK=base-sepolia
BASE_SEPOLIA_RPC_URL=https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID
```

**Benefits:**
- ✅ Full x402 protocol support
- ✅ All payment features work
- ✅ Lower gas fees (Layer 2)
- ✅ Faster transactions (~2 seconds)
- ✅ Compatible with Base ecosystem
- ✅ All test files work

**Access via:**
- **Explorer**: https://sepolia-explorer.base.org/
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **USDC**: Available via [CDP Faucet](https://portal.cdp.coinbase.com/products/faucet)

### **Alternative: Ethereum Sepolia (Legacy Support)**

<details>
<summary>Click to expand if you need Ethereum Sepolia for legacy testing</summary>

If you specifically need Ethereum Sepolia for testing:

```bash
# Configure for Ethereum Sepolia
NETWORK=sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

**Limitations:**
- ❌ x402 protocol will NOT work
- ❌ Payment middleware will NOT work
- ❌ Main application features will be limited
- ✅ Only legacy test files will work

**Access via:**
- **Explorer**: https://sepolia.etherscan.io/
- **Faucet**: https://sepoliafaucet.com/
- **USDC**: https://faucet.circle.com/

</details>

## **Configuration Files Modified**

### **1. Payment Service** (`src/lib/payment/payment-service.ts`)
- ✅ Added support for configurable RPC URLs
- ✅ Uses `BASE_SEPOLIA_RPC_URL` environment variable

### **2. Test Files**
- ✅ **`onchain-payment-test.js`** - Updated to use Base Sepolia
- ✅ **`simple-balance-check.js`** - Updated to use Base Sepolia
- ✅ **`test-payment-workflow.js`** - Already configured for Base Sepolia

### **3. Environment Template** (`env.local.template`)
- ✅ Configured for Base Sepolia as primary choice
- ✅ Uses Infura RPC endpoint for better reliability

## **Setup Instructions**

### **Step 1: Copy Configuration Template**
```bash
# Copy the template file
cp env.local.template .env.local
```

### **Step 2: Configure Environment**
```bash
# Edit .env.local and set:
NETWORK=base-sepolia
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
OPERATOR_ADDRESS=0xYourWalletAddress
OPERATOR_PRIVATE_KEY=0xYourPrivateKey
```

### **Step 3: Test Connection**
```bash
# Test Base Sepolia connection
node simple-balance-check.js

# Test payment workflow
node test-payment-workflow.js

# Test on-chain payment features
node onchain-payment-test.js
```

## **Network Comparison**

| Feature | Base Sepolia (Current) | Ethereum Sepolia (Legacy) |
|---------|----------------------|---------------------------|
| x402 Protocol | ✅ Fully Supported | ❌ Not Supported |
| Payment System | ✅ Fully Supported | ❌ Not Supported |
| Gas Fees | 🟢 Very Low (~$0.01) | 🟡 Higher (~$0.10) |
| Transaction Speed | 🟢 ~2 seconds | 🟡 ~12 seconds |
| Ecosystem | Base/Coinbase | Ethereum |
| Faucets | Easy (Coinbase) | Multiple options |
| Test Files | ✅ All Files Work | ⚠️ Limited Support |

## **Troubleshooting**

### **Common Issues:**
1. **"Network not supported"** - Make sure you're using `base-sepolia` for full app functionality
2. **"RPC URL not working"** - Check your network connection to `https://sepolia.base.org`
3. **"Payment failed"** - Ensure you have USDC on Base Sepolia

### **Getting Help:**
- Base Sepolia Explorer: https://sepolia-explorer.base.org/
- Ethereum Sepolia Explorer: https://sepolia.etherscan.io/
- Discord: Coinbase Developer Community

## **Next Steps**

1. **Choose your network** based on your needs
2. **Configure `.env.local`** with your settings
3. **Test the connection** using the appropriate test file
4. **Get testnet tokens** from the relevant faucets
5. **Run your application** with the configured network

---

**Note**: If you need full Ethereum Sepolia support in the main application, this would require extending the x402 protocol to support additional networks, which is a significant architectural change. 