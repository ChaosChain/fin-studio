# ChaosChain + Google A2A Protocol - AI-Powered Investment Research Platform

ChaosChain is a modern, open source fintech platform that leverages Google's official A2A (Agent-to-Agent) SDK and blockchain payment systems to deliver comprehensive investment research and analysis. The platform demonstrates the complete ChaosChain workflow powered by Google's official A2A Protocol, featuring agent discovery, JSON-RPC communication, DKG, verifier networks, consensus, and on-chain payments.

---

## Overview

ChaosChain combines multi-agent AI analysis with Google's official A2A Protocol for seamless agent communication. Specialized AI agents communicate using Google's A2A SDK with JSON-RPC messaging, providing real-time market insights, technical analysis, macroeconomic research, and comprehensive investment analysis. The platform integrates DKG (Distributed Knowledge Graph), verifier networks, consensus mechanisms, and blockchain payments for a complete decentralized AI workflow.

### Key Features

- **Google A2A Protocol**: Official A2A SDK with JSON-RPC 2.0 messaging
- **Multi-Agent AI System**: 16 specialized, collaborative AI agents (GPT-4 variants)
- **DKG Integration**: Distributed Knowledge Graph with Proof of Agency
- **Verifier Network**: 4 independent verifiers with consensus validation
- **Agent Reputation Network (ARN)**: Decentralized agent discovery and coordination
- **Blockchain Payments**: Integrated x402 and Commerce Payments with micro-transactions
- **Real-Time Analysis**: Live market data and AI-powered insights
- **ChaosChain Workflow**: Complete decentralized AI agent workflow
- **Modern UI**: Responsive Next.js frontend with A2A protocol indicators

## AI Agents with A2A Protocol

The platform features 16 specialized AI agents that communicate via Google's official A2A SDK:

### **Core Financial Agents (GPT-4 variants)**
- **Market Research Agents** (GPT-4, GPT-4o): Market sentiment, news analysis, trend research
- **Macro Research Agents** (GPT-4, GPT-4o): Economic indicators, central bank policies, global trends  
- **Price Analysis Agents** (GPT-4, GPT-4o): Technical analysis, chart patterns, price predictions
- **Insights Agents** (GPT-4, GPT-4o): Report generation, cross-agent analysis, recommendations

### **Verification Network**
- **Verifier Agents 1-4**: Independent verification, consensus validation, multi-criteria scoring

### **A2A Protocol Features**
- **Agent Discovery**: JSON-RPC `agent/discover` calls
- **Task Distribution**: A2A `message/send` protocol  
- **Data Sharing**: Inter-agent `data/share` communication
- **DKG Integration**: `dkg/create_node` with Proof of Agency

## Payment Systems

- **x402 Protocol**: HTTP-native payment protocol for micro-payments (Base Sepolia testnet & Base Mainnet)
- **Commerce Payments Protocol**: On-chain "authorize and capture" payment flows with escrow and flexible fees (Base network)

## Prerequisites

- **Node.js**: 18+
- **Package Manager**: yarn (recommended) or npm
- **OpenAI API Key**: Required for AI analysis
- **Google A2A SDK**: `@a2a-js/sdk` (installed automatically)
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
   yarn agents:build      # Build AI agents with A2A support
   ```
   > For payment testing, you may need ETH from the [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia) and USDC from [Circle Faucet](https://faucet.circle.com/).

5. **Start the Services** (in separate terminals):
   - **AI Agents with A2A Protocol**
     ```bash
     yarn agents:start
     ```
     Starts all 16 AI agents with Google A2A SDK integration
   - **Frontend with A2A Integration**
     ```bash
     yarn dev
     ```
     Starts the Next.js frontend with integrated A2A protocol (port 3000)

6. **Access the Application**
   - **ChaosChain + A2A Demo**: [http://localhost:3000/chaos-demo](http://localhost:3000/chaos-demo)
   - Main Dashboard: [http://localhost:3000](http://localhost:3000)
   - Agent Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Documentation

For technical architecture and further details, see [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md).

## Tech Stack

**Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI, Recharts, jsPDF  
**A2A Protocol**: Google's official `@a2a-js/sdk`, JSON-RPC 2.0 messaging  
**Backend**: Node.js, Express, OpenAI GPT-4 API, DKG, ARN, Verifier Network  
**Blockchain**: Base Sepolia/Mainnet, x402, Commerce Payments, viem, wagmi

## Project Structure

```
fin-studio/
├── src/
│   ├── app/
│   │   └── chaos-demo/        # ChaosChain + A2A Protocol Demo
│   ├── components/
│   │   ├── ChaosChainDemo.tsx # Main demo with A2A integration
│   │   ├── DKGVisualizer.tsx  # Distributed Knowledge Graph
│   │   ├── VerifierNetworkVisualizer.tsx # Verifier network
│   │   └── ui/               # Reusable UI components  
│   ├── agents/               # 16 AI agents with A2A support
│   ├── lib/
│   │   ├── a2a/             # Custom A2A implementation (legacy)
│   │   ├── payment/         # x402 & Commerce Payments
│   │   ├── dkg.ts           # Distributed Knowledge Graph
│   │   └── agent-relay-network.ts # ARN coordination
│   ├── types/
│   │   ├── a2a.ts           # A2A protocol types
│   │   └── payment.ts       # Payment system types
│   └── utils/               # Helper utilities
├── scripts/
│   └── test-a2a-integration.js # A2A protocol integration tests
├── tests/                   # A2A validation tests
├── payment/                 # Payment implementations
└── docs/                    # Documentation
```

## Available Scripts

| Script                | Description                                    |
|-----------------------|------------------------------------------------|
| `yarn dev`            | Start frontend with A2A protocol integration   |
| `yarn build`          | Build frontend for production                   |
| `yarn start`          | Start production frontend server                |
| `yarn agents:build`   | Compile TypeScript agents with A2A support     |
| `yarn agents:start`   | Start 16 agents with Google A2A SDK            |
| `yarn test:a2a`       | Test A2A protocol integration                   |
| `yarn demo:a2a`       | Show ChaosChain + A2A demo URL                  |
| `yarn lint`           | Run ESLint                                     |
| `yarn type-check`     | Run TypeScript type checking                    |

## Google A2A Protocol Integration

The platform uses Google's official A2A SDK (`@a2a-js/sdk`) for agent communication:

### **A2A Workflow Phases**
1. **🤖 A2A Agent Discovery**: JSON-RPC `agent/discover` via Google Protocol
2. **🎯 A2A Task Coordination**: Google A2A SDK coordination
3. **⚡ A2A Task Distribution**: JSON-RPC `message/send` protocol
4. **🔬 Real Analysis Execution**: A2A-coordinated agents
5. **🤝 A2A Inter-Agent Data Sharing**: `data/share` JSON-RPC calls
6. **🔗 A2A DKG Node Creation**: `dkg/create_node` with Proof of Agency
7. **💰 A2A Payment Distribution**: Consensus-based payments

### **JSON-RPC 2.0 Compliance**
- All messages follow official A2A specification
- Message structure: `{id, jsonrpc: "2.0", method, params, timestamp}`
- Methods: `agent/discover`, `message/send`, `data/share`, `dkg/create_node`

### **Testing A2A Integration**
```bash
yarn test:a2a  # Comprehensive A2A protocol validation
```

## Architecture Overview

```
Frontend with A2A Protocol → Direct Agent Communication
         ↓                           ↓
    Port 3000                 16 AI Agents + ARN
                              (Google A2A SDK)
                                     ↓
            DKG → Verifiers → Consensus → Payments
```

**Integrated A2A Workflow:**
- Frontend includes A2A protocol integration
- Agents communicate via Google's official A2A SDK
- No separate gateway server needed
- Complete ChaosChain workflow in one demo

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

## ChaosChain Workflow

The complete ChaosChain workflow integrates Google A2A Protocol with decentralized AI:

### **Phase 1: A2A Agent Discovery**
- Agents discover each other via Google A2A protocol
- JSON-RPC `agent/discover` calls identify capabilities
- ARN (Agent Reputation Network) coordinates agent selection

### **Phase 2: A2A Task Distribution**  
- Tasks distributed via A2A `message/send` protocol
- Real-time financial analysis coordinated across 16 agents
- GPT-4 variants provide specialized analysis

### **Phase 3: A2A Inter-Agent Data Sharing**
- Agents share data via A2A `data/share` JSON-RPC calls
- Market → Insights, Price → Insights, Macro → Insights
- Real analysis data flows between agents

### **Phase 4: DKG & Proof of Agency**
- Distributed Knowledge Graph stores agent outputs
- A2A `dkg/create_node` creates signed nodes
- Proof of Agency validates agent authenticity

### **Phase 5: Verifier Network & Consensus**
- 4 independent verifiers validate all outputs
- Multi-criteria scoring and consensus calculation
- Reputation updates based on verification results

### **Phase 6: Payment Distribution**
- Consensus-based payments to agents
- Micro-transactions via x402 protocol
- Agent wallets and payment records tracked

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

### Agent System Deployment (with A2A)

1. Build agents: `yarn agents:build`
2. Deploy the `dist/` folder to your server
3. Set up environment variables (including OpenAI API key)
4. Start with a process manager: `yarn agents:start`
5. Verify A2A integration: `yarn test:a2a`

## Contributing

We welcome contributions to the ChaosChain + Google A2A Protocol project! To maintain high code quality and A2A compliance, please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests as appropriate
4. Ensure all checks pass: `yarn lint && yarn type-check && yarn test:a2a`
5. Commit: `git commit -am 'Add your feature'`
6. Push: `git push origin feature/your-feature`  
7. Open a Pull Request with a clear description

**A2A Integration Requirements:**
- All agent communication must use Google A2A SDK
- JSON-RPC 2.0 compliance required
- Test A2A integration with `yarn test:a2a`

Please review the [CONTRIBUTING.md](payment/x402/CONTRIBUTING.md) for more details on our contribution process and code of conduct.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

- **ChaosChain + A2A Demo**: Visit [http://localhost:3000/chaos-demo](http://localhost:3000/chaos-demo)
- **A2A Integration Testing**: Run `yarn test:a2a` to verify protocol compliance
- **Documentation**: See this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### **Quick Demo Commands**
```bash
# Start the complete ChaosChain + A2A workflow
yarn dev              # Frontend with A2A integration
yarn agents:start     # 16 agents with Google A2A SDK
yarn test:a2a         # Verify A2A protocol integration
yarn demo:a2a         # Show demo URL
```


