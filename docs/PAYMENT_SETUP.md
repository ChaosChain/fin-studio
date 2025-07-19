# Payment System Setup

This document explains how to set up and use the payment system integrated with the Fin Studio application.

## Overview

The payment system integrates two protocols:
- **x402 Protocol**: HTTP-native micropayment protocol for agent requests
- **Base Commerce Payments**: On-chain escrow system for secure payment handling

## Architecture

```
Client Request → Agent (x402) → Payment Required (402)
               ↓
Client Payment → Escrow Contract → Payment Verified
               ↓
Agent Processes Request → Response Delivered
```

## Environment Setup

Create a `.env.local` file with the following configuration:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Market Data API Keys (Optional - falls back to mock data if not provided)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Agent Manager Configuration
AGENT_MANAGER_PORT=8080

# Payment System Configuration
NETWORK=base-sepolia
OPERATOR_ADDRESS=0x0000000000000000000000000000000000000000
OPERATOR_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
FACILITATOR_URL=https://x402.org/facilitator
ESCROW_CONTRACT_ADDRESS=0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff
```

## Market Data API Setup

### Alpha Vantage API (for Stock Data)
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free API key
3. Add `ALPHA_VANTAGE_API_KEY=your_key_here` to your `.env.local`

### CoinGecko API (for Crypto Data)
- No API key required for basic usage
- The system automatically falls back to mock data if APIs are unavailable

## Agent Pricing Configuration

Each agent has configurable pricing:

- **Market Research Agent**: $0.01 USDC per request
- **Macro Research Agent**: $0.02 USDC per request  
- **Price Analysis Agent**: $0.005 USDC per request
- **Insights Agent**: $0.03 USDC per request

## Payment Flow

### 1. Request Phase
```typescript
// Client makes request to agent
const response = await a2aClient.sendMessage('market-research-agent', 'analyze_market_sentiment', { symbols: ['AAPL'] });
```

### 2. Payment Required (402)
If payment is required, the agent responds with:
```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia", 
    "maxAmountRequired": "10000",
    "resource": "/agents/market-research-agent",
    "description": "Market Research and Analysis",
    "payTo": "0x...",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  }]
}
```

### 3. Payment Authorization
Client creates payment signature and retries request:
```typescript
// Payment header includes EIP-3009 signature
const paymentHeader = createPaymentHeader(walletClient, paymentRequirements);
// Retry request with payment
const response = await a2aClient.sendMessage(agentId, action, data, { payment: paymentHeader });
```

### 4. Escrow Operations

The system supports the full escrow lifecycle:

- **Authorize**: Lock funds in escrow for future capture
- **Capture**: Transfer funds from escrow to merchant
- **Charge**: Authorize + Capture in single transaction (demo mode)
- **Refund**: Return captured funds to payer
- **Void**: Cancel authorization and return funds

## Components

### Payment Service (`src/lib/payment/payment-service.ts`)
Core service that handles:
- X402 payment verification
- Escrow contract interactions
- Session management
- Payment history

### Payment Middleware (`src/lib/payment/payment-middleware.ts`)
A2A middleware that:
- Intercepts agent requests
- Checks payment requirements
- Verifies payment headers
- Returns 402 responses when needed

### Payment Dialog (`src/components/PaymentDialog.tsx`)
UI component for:
- Displaying payment requirements
- Handling payment flows
- Showing transaction status
- Managing wallet interactions

## Testing

### Development Mode
In development, payments are simulated:
```typescript
// Simulated successful payment
const simulatedTxHash = '0x' + Math.random().toString(16).substring(2, 66);
setTimeout(() => {
  setPaymentStatus(PaymentStatus.CAPTURED);
  onPaymentSuccess(simulatedTxHash);
}, 2000);
```

### Production Mode
In production, replace simulation with actual contract calls:
```typescript
const hash = await walletClient.writeContract({
  address: escrowContractAddress,
  abi: escrowABI,
  functionName: 'charge',
  args: [paymentInfo, amount, tokenCollector, collectorData, feeBps, feeReceiver]
});
```

## Security Considerations

1. **Operator Private Key**: Store securely, never commit to version control
2. **Payment Verification**: Always verify signatures and amounts
3. **Escrow Constraints**: Payments are cryptographically constrained by the protocol
4. **Time Locks**: Authorizations expire automatically
5. **Refund Safety**: Payers can always reclaim expired authorizations

## API Integration

### Creating Payment Sessions
```typescript
const session = await agentManager.createPaymentSession(
  'market-research-agent',
  '0x...',  // payer address
  { symbols: ['AAPL', 'GOOGL'] }
);
```

### Payment History
```typescript
const history = await agentManager.getPaymentHistory('market-research-agent');
```

### Agent Capabilities
Payment-enabled agents expose additional capabilities:
```json
{
  "capabilities": [
    "market_analysis",
    "sentiment_analysis", 
    "news_analysis",
    "payment_required",
    "x402_protocol",
    "escrow_payments"
  ]
}
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: The system automatically finds available ports if defaults are in use
2. **Invalid Payments**: Check signature format and amount requirements
3. **Network Mismatch**: Ensure client and server use same network (base/base-sepolia)
4. **Expired Authorizations**: Payments expire after configured timeout

### Debug Logging
Enable debug logging in payment middleware:
```typescript
console.log('Payment required response:', response);
console.log('Payment verification error:', error);
```

## Integration with Base Ecosystem

The system leverages Base's infrastructure:
- **Base Sepolia**: Testing and development
- **Base Mainnet**: Production deployments
- **USDC**: Primary payment token
- **Commerce Payments**: Audited escrow contracts

This ensures compatibility with the broader Base ecosystem and provides production-ready payment infrastructure. 