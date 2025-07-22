# Fin Studio - AI-Powered Investment Research & Analysis Platform

Fin Studio is a modern, open source fintech platform that leverages advanced AI agents and blockchain payment systems to deliver comprehensive investment research and analysis. The platform is designed for extensibility, maintainability, and professional collaboration, with a focus on robust architecture and clear documentation.

---

## Overview

Fin Studio combines multi-agent AI analysis with integrated blockchain payments. Specialized AI agents communicate using Google Cloud's A2A (Agent-to-Agent) protocol, providing real-time market insights, technical analysis, macroeconomic research, and comprehensive investment analysis. The platform supports both HTTP-native and on-chain payment protocols for seamless financial operations.

### Key Features

- **Multi-Agent AI System**: Four specialized, collaborative AI agents
- **Blockchain Payments**: Integrated x402 and Commerce Payments protocols
- **Real-Time Analysis**: Live market data and AI-powered insights
- **Technical Analysis**: Advanced charting and indicators
- **Macro Research**: Economic indicators and global trends
- **PDF Reports**: Professional-grade investment reports
- **Modern UI**: Responsive Next.js frontend

## AI Agents

- **Market Research Agent** (Port 8081): Market trend analysis, news sentiment, social media monitoring
- **Macro Research Agent** (Port 8082): Economic indicators, central bank policies, global trends
- **Price Analysis Agent** (Port 8083): Real-time market data, technical analysis, chart patterns
- **Insights Agent** (Port 8084): Coordination, report generation, personalized analysis

## Payment Systems

- **x402 Protocol**: HTTP-native payment protocol for micro-payments (Base Sepolia testnet & Base Mainnet)
- **Commerce Payments Protocol**: On-chain "authorize and capture" payment flows with escrow and flexible fees (Base network)

## Prerequisites

- **Node.js**: 18+
- **Package Manager**: yarn (recommended) or npm
- **OpenAI API Key**: Required for AI analysis
- **Blockchain Wallet**: For payment testing (optional)

## Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ChaosChain/fin-studio
   cd fin-studio
   ```
2. **Install Dependencies**
   ```bash
   yarn install
   ```
3. **Environment Setup**
   - Copy the example environment file:
     ```bash
     cp env.local.example .env.local
     ```
   - Configure your environment variables in `.env.local`:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     AGENT_MANAGER_PORT=8080
     NETWORK=base-sepolia
     OPERATOR_ADDRESS=0x0000000000000000000000000000000000000000
     OPERATOR_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
     FACILITATOR_URL=https://x402.org/facilitator
     ESCROW_CONTRACT_ADDRESS=0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff
     DEVELOPMENT_MODE=true
     BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
     ```
4. **Build the Application**
   ```bash
   yarn agents:build      # Build AI agents
   yarn gateway:build     # Build gateway server
   ```
   > For payment testing, you may need ETH from the [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia) and USDC from [Circle Faucet](https://faucet.circle.com/).

5. **Start the Services** (in separate terminals):
   - **AI Agents**
     ```bash
     yarn agents:start
     ```
     Starts all 4 AI agents (ports 8081-8084)
   - **Gateway Server**
     ```bash
     yarn gateway:start
     ```
     Starts the HTTP gateway (port 8080)
   - **Frontend**
     ```bash
     yarn dev
     ```
     Starts the Next.js frontend (port 3000)

6. **Access the Application**
   - Main Dashboard: [http://localhost:3000](http://localhost:3000)
   - Agent Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - Payment Demo: [http://localhost:3000/demo](http://localhost:3000/demo)

## Documentation

For technical architecture and further details, see [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md).

## Tech Stack

**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI, Recharts, jsPDF  
**Backend**: Node.js, Express, A2A protocol, OpenAI GPT-4 API, WebSockets  
**Blockchain**: Base Sepolia/Mainnet, x402, Commerce Payments, viem, wagmi

## Project Structure

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

## Available Scripts

| Script                | Description                        |
|-----------------------|------------------------------------|
| `yarn dev`            | Start frontend development server   |
| `yarn build`          | Build frontend for production       |
| `yarn start`          | Start production frontend server    |
| `yarn agents:build`   | Compile TypeScript agents           |
| `yarn agents:start`   | Start agent manager and all agents  |
| `yarn gateway:start`  | Start HTTP gateway server           |
| `yarn lint`           | Run ESLint                         |
| `yarn type-check`     | Run TypeScript type checking        |

## A2A Protocol Implementation

The platform implements Google Cloud's A2A protocol for agent communication:

1. **Agent Registration**: Agents register with a central registry
2. **Service Discovery**: Agents dynamically discover capabilities
3. **Message Routing**: HTTP-based message routing between agents
4. **Error Handling**: Robust error handling and retry mechanisms
5. **Monitoring**: Real-time agent status and metrics

## Architecture Overview

```
Frontend (Next.js) → Gateway Server → AI Agents
     ↓                    ↓              ↓
Port 3000            Port 8080    Ports 8081-8084
```

## Payment Integration

### x402 Protocol

HTTP-native payments can be integrated as middleware:

```typescript
app.use(
  paymentMiddleware("0xYourAddress", { 
    "/your-endpoint": "$0.01" 
  })
);
```

### Commerce Payments

For advanced payment flows (authorize and capture):

```typescript
const authResult = await authorizePayment(payer, amount, token);
const captureResult = await capturePayment(authId, amount);
```

### Supported Networks

- **Base Sepolia**: Testnet for development
- **Base Mainnet**: Production network

## Development

### Adding New Agents

1. Create a new agent class in `src/agents/`
2. Implement required interfaces from `src/types/a2a.ts`
3. Register the agent in `src/agents/manager.ts`
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

- Obtain an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Add it to `.env.local`
- Monitor usage and costs

### Market Data Sources

- **OpenAI Search**: Real-time market data and news
- **AI-Powered Analysis**: All analysis via OpenAI GPT-4
- **Comprehensive Coverage**: Market data, news, economic indicators

## Security

- Store API keys in environment variables
- Use secure HTTP for A2A communication
- Validate all agent inputs
- Implement robust error handling to prevent information leakage
- Use audited smart contracts for payment systems

## Monitoring and Debugging

- Monitor agent health and metrics via the dashboard
- Enable debug logging for troubleshooting:
  ```bash
  DEBUG=fin-studio:* yarn agents:start
  ```
- Track OpenAI API usage and per-agent costs

## Deployment

### Frontend Deployment (Vercel or similar)

```bash
yarn build
# Deploy the output to Vercel or your preferred platform
```

### Agent Manager Deployment

1. Build agents: `yarn agents:build`
2. Deploy the `dist/` folder to your server
3. Set up environment variables
4. Start with a process manager (e.g., PM2, Docker)

## Contributing

We welcome contributions from the community! To maintain high code quality and project integrity, please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests as appropriate
4. Ensure all checks pass: `yarn lint && yarn type-check`
5. Commit: `git commit -am 'Add your feature'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request with a clear description

Please review the [CONTRIBUTING.md](payment/x402/CONTRIBUTING.md) for more details on our contribution process and code of conduct.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas


