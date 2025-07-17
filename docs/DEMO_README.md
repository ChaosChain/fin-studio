# Payment Integration Demo

This demo showcases the x402 micropayment protocol integrated with Base's commerce-payments escrow system in a Next.js fintech application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Setup

The project includes a `.env.local` file. Update it with your keys:

```env
# OpenAI API Key (Optional - for AI agents)
OPENAI_API_KEY=your_openai_api_key_here

# Payment System Configuration
NETWORK=base-sepolia
DEVELOPMENT_MODE=true
```

### 3. Run the Demo

```bash
# Start the development server
yarn dev

# In a new terminal, build and start the agents (optional)
yarn agents:build && yarn agents:start
```

### 4. View the Demo

- **Main Application**: http://localhost:3000
- **Payment Demo**: http://localhost:3000/demo

## 🎯 Demo Features

### Payment Integration
- **x402 Protocol**: HTTP-native micropayment protocol
- **Base Commerce Payments**: Secure escrow system
- **Development Mode**: Simulated payments for testing
- **Real Payment Flow**: Ready for production deployment

### AI Agents with Payment
- **Market Research Agent**: $0.01 USDC per request
- **Macro Research Agent**: $0.02 USDC per request
- **Price Analysis Agent**: $0.005 USDC per request
- **Insights Agent**: $0.03 USDC per request

### Payment Flow
1. User selects an AI agent service
2. System returns 402 Payment Required with x402 headers
3. User signs payment authorization (simulated in demo)
4. Payment is processed through Base escrow contract
5. Service is delivered to user

## 🔧 Technical Architecture

### Payment Stack
- **Frontend**: Next.js 14 with React Query
- **Payment Protocol**: x402 HTTP-native payments
- **Blockchain**: Base Sepolia (testnet)
- **Escrow**: Base Commerce Payments contracts
- **Token**: USDC (testnet)

### Components
- **PaymentService**: Core payment handling logic
- **PaymentMiddleware**: A2A request interception
- **PaymentDialog**: User payment interface
- **AgentManager**: Coordinates AI agents with payments

## 📱 Testing the Demo

### Development Mode (Default)
- Payments are simulated
- No real blockchain transactions
- Instant payment completion
- Perfect for development and testing

### Production Mode
To test with real payments:
1. Set `DEVELOPMENT_MODE=false` in `.env.local`
2. Add valid `OPERATOR_PRIVATE_KEY`
3. Ensure you have Base Sepolia USDC
4. Connect wallet to Base Sepolia network

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   AI Agents     │    │  Base Escrow    │
│                 │    │                 │    │                 │
│  PaymentDialog  │◄──►│ PaymentService  │◄──►│ Commerce Payments│
│                 │    │                 │    │                 │
│  x402 Client    │    │ x402 Middleware │    │ USDC Token      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Security Features

- **Escrow Protection**: Funds held in audited smart contracts
- **Signature Verification**: EIP-3009 payment signatures
- **Amount Limits**: Cryptographically enforced payment caps
- **Time Locks**: Automatic expiration of payment authorizations
- **Refund Safety**: Users can reclaim expired payments

## 🎨 UI Components

The demo includes modern UI components:
- **Card Components**: Service display
- **Payment Dialog**: Interactive payment flow
- **Status Indicators**: Payment completion feedback
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Development

### Building
```bash
yarn build        # Build Next.js app
yarn agents:build # Build AI agents
```

### Testing
```bash
yarn lint         # Check code quality
yarn type-check   # Validate TypeScript
```

### File Structure
```
src/
├── app/
│   ├── demo/          # Payment demo page
│   └── providers.tsx  # React Query setup
├── components/
│   ├── ui/           # Reusable UI components
│   └── PaymentDialog.tsx
├── lib/
│   └── payment/      # Payment system logic
└── types/
    └── payment.ts    # Payment type definitions
```

## 🌐 Production Deployment

For production deployment:
1. Set environment variables for mainnet
2. Configure Base mainnet contracts
3. Set up proper private key management
4. Enable real USDC payments
5. Configure rate limiting and monitoring

## 🔗 Links

- **x402 Protocol**: https://x402.org
- **Base Network**: https://base.org
- **Commerce Payments**: https://github.com/base-org/paymaster
- **Next.js**: https://nextjs.org

## 🤝 Contributing

This demo is designed to be extended and customized:
- Add new AI agents with different pricing
- Implement custom payment schemes
- Integrate with different blockchain networks
- Add advanced payment features

## 📝 License

This demo is open source and available under the MIT License. 