# Individual Agent Payments for Reports

This document describes the payment-gated report feature that requires users to make individual payments to each contributing agent to unlock comprehensive analysis reports.

## Overview

The chaos demo now includes individual agent payments that:
1. **Multiple Transactions**: Users make 8 separate transactions to individual agent addresses
2. **Direct Payments**: Each agent receives payment directly from the user (no intermediary)
3. **Generated Agent Wallets**: Each agent has a dedicated wallet generated from private keys
4. **Transparent Distribution**: Users can see exactly which agent gets paid what amount

## Payment Flow

```
User Analysis Request → Agents Perform Work → Analysis Complete → Direct Payments → Report Unlocked
                                                                       ↓
                                               User → Each Agent (8 separate transactions)
```

## Distribution Model

### Worker Agents (70% of payment)
- **Market Research Agent**: Analyzes market sentiment and news
- **Macro Research Agent**: Analyzes economic indicators  
- **Price Analysis Agent**: Performs technical analysis
- **Insights Agent**: Generates AI-powered insights

**Distribution**: Equal split among all worker agents (17.5% each for 4 agents)

### Verifier Agents (25% of payment)
- **Verifier Agent 1-4**: Independent verification of analysis results
- **Consensus Validation**: Multi-criteria verification process

**Distribution**: Equal split among all verifier agents (6.25% each for 4 agents)

### Platform Fee (5% of payment)
- Reserved for platform operations and maintenance

## Technical Implementation

### Agent Wallet Management
```typescript
// Agent wallet service manages wallets with generated private keys
const wallet = await agentWalletService.getOrCreateAgentWallet(agentId);

// Each agent gets a unique wallet with generated private key
{
  agentId: 'market-research-agent',
  walletAddress: '0x...',
  privateKey: '0x...',
  createdAt: new Date()
}
```

### Payment Distribution Calculation
```typescript
const distribution = agentWalletService.calculatePaymentDistribution(
  totalAmountWei,      // 1 USDC in wei
  involvedAgents,      // All agent IDs
  workerAgentIds,      // Worker agent IDs
  verifierAgentIds     // Verifier agent IDs
);

// Process direct payments to each agent
const result = await agentWalletService.processDirectPayments(
  distribution,
  userAddress
);
```

### API Integration
```typescript
// Process direct payments to all agents
POST /api/payment/report-access
{
  "taskId": "task_123",
  "userAddress": "0x...",
  "amount": 1
}

// Response includes direct payment details
{
  "success": true,
  "paymentId": "payment-task_123-timestamp",
  "payment": {
    "paymentMethod": "direct_to_agents",
    "transactionCount": 8,
    "distribution": [
      {
        "agentId": "market-research-agent",
        "walletAddress": "0x...",
        "amount": 0.175,
        "percentage": 0.175,
        "transaction": "0x..."
      },
      // ... 7 more direct payments
    ]
  }
}
```

## UI/UX Features

### Payment Button
- Shows "💰 Pay 1 USDC for Report" before payment
- Changes to "📊 View Final Report" after payment
- Displays processing state during payment

### Payment Distribution Display
After successful payment, users see:
- **Worker Agents Section**: Shows which agents performed the work
- **Verifier Agents Section**: Shows which agents verified the results  
- **Platform Fee**: Transparent display of platform fee
- **Transaction IDs**: Links to blockchain transactions (in production)

### Development vs Production Mode

#### Development Mode (Default)
- Generates deterministic wallet addresses
- Simulates payment distribution
- No real blockchain transactions
- Perfect for testing and demonstration

#### Production Mode
- Uses generated private keys for real wallets
- Processes actual USDC payments with real transfers
- Records real blockchain transactions
- Requires operator private key for distribution

## Configuration

### Environment Variables
```env
# Agent Wallet Configuration
NEXT_PUBLIC_AGENT_WALLET_ADDRESS=0x...
WALLET_SEED=your-secure-seed-for-key-generation

# Development/Production Toggle
DEVELOPMENT_MODE=true

# For production payments
OPERATOR_PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Agent Pricing
Each agent has individual pricing for their services:
```typescript
const AGENT_PRICES = {
  'market-research-agent': '$0.01',
  'macro-research-agent': '$0.02', 
  'price-analysis-agent': '$0.005',
  'insights-agent': '$0.03'
};
```

The report payment (1 USDC) is separate and covers access to the final compiled report.

## Security Considerations

### Payment Verification
- All payments verified through x402 protocol
- Signature validation for payment authenticity
- Timeout protection against expired payments

### Wallet Security
- Each agent has isolated wallet with unique private key
- Private keys generated deterministically from secure seed
- No shared wallet vulnerabilities
- Private keys can be exported for backup/management

### Distribution Transparency
- All distributions logged and auditable
- Users can see exact payment breakdown
- Blockchain transactions provide permanent record

## Testing

### Manual Testing
1. Run comprehensive analysis in chaos demo
2. Click "Pay Agents Directly (8 TXs)" when analysis completes
3. System processes 8 individual payments automatically
4. Verify each agent receives individual transaction
5. Confirm report access is granted after all payments

### API Testing
```bash
# Test the individual payment API directly
node scripts/test-payment-integration.js
```

### Expected Results
- 8 individual transactions (User → Each Specific Agent Address)
- Worker agents: $0.175 each to their wallet addresses (17.5% each)
- Verifier agents: $0.0625 each to their wallet addresses (6.25% each)
- No platform transaction - fee accounted for in distribution calculation
- Total: $0.95 sent across 8 separate transactions to 8 different addresses

## Future Enhancements

### Dynamic Pricing
- Adjust payment based on analysis complexity
- Different pricing tiers for different report types
- Volume discounts for frequent users

### Enhanced Distribution
- Performance-based distribution (higher quality = higher payment)
- Reputation-weighted distribution
- Bonus payments for exceptional work

### Payment Options
- Multiple cryptocurrency support
- Fiat payment integration
- Subscription models

## Troubleshooting

### Common Issues

**"Payment processing failed"**
- Check network connectivity
- Verify user has sufficient USDC balance
- Ensure Base Sepolia network is accessible

**"Agent wallet not found"**
- Restart application to reinitialize wallets
- Check WALLET_SEED configuration for deterministic generation
- Verify network configuration and RPC endpoints

**"Distribution calculation error"**
- Ensure all agents completed their work
- Check that consensus was reached
- Verify agent IDs match expected values

### Debug Mode
Enable debug logging:
```typescript
console.log('💰 SIMULATING PAYMENT DISTRIBUTION:');
// Detailed distribution breakdown logged to console
```

## Integration Examples

### Custom Agent Integration
```typescript
// Add new agent to payment distribution
const customAgent = await agentWalletService.getOrCreateAgentWallet('custom-agent-id');

// Include in distribution calculation
const distribution = agentWalletService.calculatePaymentDistribution(
  totalAmount,
  [...standardAgents, 'custom-agent-id'],
  [...workerAgents, 'custom-agent-id'],
  verifierAgents
);
```

### Real Blockchain Integration
```typescript
// For production deployment with real payments
if (!isDevelopmentMode && operatorPrivateKey) {
  const result = await agentWalletService.distributePayments(
    distribution,
    userAddress,
    operatorPrivateKey
  );
  // Real blockchain transactions executed
}
```

### Private Key Management
```typescript
// Export all agent private keys for backup
const walletKeys = agentWalletService.exportWalletKeys();
console.log('Agent Wallets:', walletKeys);
// [
//   { agentId: 'market-research-agent', privateKey: '0x...', address: '0x...' },
//   { agentId: 'macro-research-agent', privateKey: '0x...', address: '0x...' },
//   ...
// ]
```

This individual agent payment system demonstrates true peer-to-peer micropayments where users send specific amounts directly to each contributing agent's wallet address. Using simple private key generation for agent wallets, it eliminates all intermediaries and provides complete transparency. Each agent receives their exact contribution amount through individual blockchain transactions. This approach showcases the ideal of decentralized AI service payments - direct user-to-agent compensation with no platform middleman. Perfect for demonstrations and real-world deployment of fair agent compensation. 