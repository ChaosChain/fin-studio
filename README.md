# Fin Studio - AI-Powered Investment Analysis Platform

<div align="center">

![Fin Studio](https://img.shields.io/badge/Fin%20Studio-AI%20Powered%20Investment%20Analysis-blue?style=for-the-badge&logo=typescript)

**A modern fintech platform powered by AI agents using Google Cloud's A2A (Agent-to-Agent) protocol for seamless communication and collaboration, with integrated blockchain payment systems.**

[Quick Start](#quick-start) • [AI Agents](#ai-agents) • [Payment Systems](#payment-systems) • [Tech Stack](#tech-stack) • [Documentation](#documentation)

</div>

---

## Overview

Fin Studio is a comprehensive AI-powered investment analysis platform that combines advanced financial analysis with blockchain payment infrastructure. The platform features specialized AI agents that collaborate using the A2A protocol to provide real-time market insights, technical analysis, and investment recommendations.

### Key Features

- **Multi-Agent AI System**: Four specialized AI agents working collaboratively
- **Blockchain Payments**: Integrated x402 and Commerce Payments protocols
- **Real-time Analysis**: Live market data and AI-powered insights
- **Technical Analysis**: Advanced chart patterns and indicators
- **Macro Research**: Economic indicators and global trends
- **PDF Reports**: Professional-grade investment reports
- **Modern UI**: Beautiful, responsive Next.js frontend

## AI Agents

### Market Research Agent
- **Port**: 8081
- **Capabilities**: Market trend analysis, news sentiment, social media monitoring
- **Output**: Comprehensive market insights and sentiment analysis

### Macro Research Agent  
- **Port**: 8082
- **Capabilities**: Economic indicators, central bank policies, global trends
- **Output**: Macroeconomic analysis and policy insights

### Price Analysis Agent
- **Port**: 8083
- **Capabilities**: Real-time market data, technical analysis, chart patterns
- **Output**: Price targets, risk metrics, trading signals

### Insights Agent
- **Port**: 8084
- **Capabilities**: Coordination, report generation, personalized analysis
- **Output**: Daily insights and investment recommendations

## Payment Systems

### x402 Protocol Integration
- **Purpose**: HTTP-native payment protocol for micro-payments
- **Features**: 1-line integration, 2-second settlement, $0.001 minimum
- **Network**: Base Sepolia (testnet) and Base Mainnet

### Commerce Payments Protocol
- **Purpose**: On-chain "authorize and capture" payment flows
- **Features**: Escrow-based payments, flexible fee structures
- **Contracts**: Deployed on Base network with audited smart contracts

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Charts**: Recharts for data visualization
- **PDF**: jsPDF for report generation

### Backend
- **Runtime**: Node.js with Express
- **Protocol**: A2A (Agent-to-Agent) communication
- **AI**: OpenAI GPT-4 API
- **WebSockets**: Real-time agent communication

### Blockchain
- **Network**: Base Sepolia (testnet) / Base Mainnet
- **Protocols**: x402, Commerce Payments
- **Libraries**: viem, wagmi for Web3 integration

## Prerequisites

- **Node.js**: 18+ 
- **Package Manager**: yarn (recommended) or npm
- **OpenAI API Key**: Required for AI analysis
- **Blockchain Wallet**: For payment testing (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fin-studio
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Setup

Create a `.env.local` file:

```bash
cp env.local.example .env.local
```

Configure your environment variables:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Agent Manager Configuration
AGENT_MANAGER_PORT=8080

# Payment System Configuration (Base Sepolia)
NETWORK=base-sepolia
OPERATOR_ADDRESS=0x0000000000000000000000000000000000000000
OPERATOR_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
FACILITATOR_URL=https://x402.org/facilitator
ESCROW_CONTRACT_ADDRESS=0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff

# Development Mode
DEVELOPMENT_MODE=true

# Base Sepolia RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 4. Build the Application

```bash
# Build AI agents
yarn agents:build

# Build gateway server
yarn gateway:build
```

You may need ETH on Base Sepolia Faucet via https://www.alchemy.com/faucets/base-sepolia and USDC on Base Sepolia via https://faucet.circle.com/ for testing the payment function.



### 5. Start the Services

You need to run three services in separate terminals:

#### Terminal 1: AI Agents
```bash
yarn agents:start
```
Starts all 4 AI agents on ports 8081-8084

#### Terminal 2: Gateway Server
```bash
yarn gateway:start
```
Starts the HTTP gateway on port 8080

#### Terminal 3: Frontend
```bash
yarn dev
```
Starts the Next.js frontend on port 3000

### 6. Access the Application

- **Main Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Agent Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Payment Demo**: [http://localhost:3000/demo](http://localhost:3000/demo)

## Documentation

For detailed technical architecture, please refer to [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md).

### Project Structure

```
fin-studio/
├── src/
│   ├── app/                    # Next.js app router
│   ├── components/             # React components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...                # Feature components
│   ├── agents/                # AI agent implementations
│   ├── lib/                   # Utilities and services
│   │   ├── a2a/              # A2A protocol implementation
│   │   └── payment/           # Payment middleware
│   ├── types/                 # TypeScript definitions
│   └── utils/                 # Helper utilities
├── payment/                   # Payment system implementations
│   ├── x402/                 # x402 protocol
│   └── commerce-payments/     # Commerce Payments protocol
├── dist/                      # Compiled agents
└── docs/                      # Documentation
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start frontend development server |
| `yarn build` | Build frontend for production |
| `yarn start` | Start production frontend server |
| `yarn agents:build` | Compile TypeScript agents |
| `yarn agents:start` | Start agent manager and all agents |
| `yarn gateway:start` | Start HTTP gateway server |
| `yarn lint` | Run ESLint |
| `yarn type-check` | Run TypeScript type checking |

### A2A Protocol Implementation

The platform implements Google Cloud's A2A protocol:

1. **Agent Registration**: Agents register with central registry
2. **Service Discovery**: Agents discover capabilities dynamically
3. **Message Routing**: HTTP-based message routing between agents
4. **Error Handling**: Robust error handling and retry mechanisms
5. **Monitoring**: Real-time agent status and metrics

### Architecture Overview

```
Frontend (Next.js) → Gateway Server → AI Agents
     ↓                    ↓              ↓
Port 3000            Port 8080    Ports 8081-8084
```

## Payment Integration

### x402 Protocol

The x402 protocol enables HTTP-native payments:

```typescript
// Server-side integration
app.use(
  paymentMiddleware("0xYourAddress", { 
    "/your-endpoint": "$0.01" 
  })
);
```

### Commerce Payments

For more complex payment flows:

```typescript
// Authorize and capture pattern
const authResult = await authorizePayment(payer, amount, token);
const captureResult = await capturePayment(authId, amount);
```

### Supported Networks

- **Base Sepolia**: Testnet for development
- **Base Mainnet**: Production network

## Development

### Adding New Agents

1. Create agent class in `src/agents/`
2. Implement required interfaces from `src/types/a2a.ts`
3. Register agent in `src/agents/manager.ts`
4. Add port configuration

Example:

```typescript
export class CustomAgent {
  getIdentity(): AgentIdentity {
    return {
      id: 'custom-agent',
      name: 'Custom Agent',
      type: AgentType.CUSTOM,
      version: '1.0.0',
      capabilities: ['custom_analysis']
    };
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map();
    handlers.set('custom_action', this.customAction.bind(this));
    return handlers;
  }

  private async customAction(message: A2AMessage): Promise<A2AMessage> {
    // Implementation
  }
}
```

### API Integration

#### OpenAI Configuration

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`
3. Monitor usage and costs

#### Market Data Sources

- **OpenAI Search**: Real-time market data and news
- **AI-Powered Analysis**: All analysis via OpenAI GPT-4
- **Comprehensive Coverage**: Market data, news, economic indicators

## Security

- API keys stored in environment variables
- A2A communication via secure HTTP
- Input validation on all agent interactions
- Error handling prevents information leakage
- Audited smart contracts for payment systems

## Monitoring and Debugging

### Agent Status

Monitor agent health via dashboard:
- Real-time connection status
- Message processing metrics
- Error rates and logs

### Debugging

Enable debug logging:

```bash
DEBUG=fin-studio:* yarn agents:start
```

### Cost Tracking

The platform includes comprehensive cost tracking:
- OpenAI API usage monitoring
- Per-agent cost breakdown
- Real-time cost reporting

## Deployment

### Frontend Deployment (Vercel)

```bash
yarn build
# Deploy to Vercel or preferred platform
```

### Agent Manager Deployment

For production deployment:

1. Build agents: `yarn agents:build`
2. Deploy `dist/` folder to server
3. Set up environment variables
4. Start with process manager (PM2, Docker, etc.)


## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -am 'Add new feature'`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas


