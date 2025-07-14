# Fin Studio - AI-Powered Investment Analysis Platform

A modern fintech platform powered by AI agents using Google Cloud's A2A (Agent-to-Agent) protocol for seamless communication and collaboration.

## 🚀 Features

- **Multi-Agent Architecture**: Specialized AI agents for different analysis tasks
- **A2A Protocol Integration**: Implements Google Cloud's Agent-to-Agent protocol
- **AI-Powered Market Analysis**: Real-time market data and insights powered by OpenAI
- **Technical Analysis**: Advanced chart patterns and technical indicators
- **Macro Research**: Economic indicators and global trends analysis
- **Daily Insights**: AI-generated investment insights and reports
- **Modern UI**: Beautiful, responsive Next.js frontend with Tailwind CSS

## 🤖 AI Agents

### Market Research Agent
- Analyzes market trends and news sentiment
- Provides comprehensive market insights
- Tracks social media sentiment

### Macro Research Agent
- Monitors economic indicators
- Analyzes central bank policies
- Tracks global macroeconomic trends

### Price Analysis Agent
- Fetches real-time market data
- Performs technical analysis
- Identifies chart patterns and trading signals

### Insights Agent
- Coordinates with other agents
- Generates daily insights reports
- Delivers personalized analysis

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, HTTP Gateway (A2A Protocol)
- **AI**: OpenAI GPT-4, Custom LLM integrations
- **Data**: OpenAI Search API
- **Architecture**: Agent-to-Agent (A2A) Protocol

## 📋 Prerequisites

- Node.js 18+ 
- yarn or npm
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd fin-studio
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Agent Manager Configuration
AGENT_MANAGER_PORT=8080
```

### 4. Build the agents

```bash
yarn agents:build
```

### 5. Start the application

To run the complete application, you need to start three services in separate terminals:

#### Terminal 1: Start the AI Agents
```bash
yarn agents:start
```
This starts all 4 specialized AI agents on ports 8081-8084:
- Market Research Agent (port 8081)
- Macro Research Agent (port 8082) 
- Price Analysis Agent (port 8083)
- Insights Agent (port 8084)

#### Terminal 2: Start the Gateway Server
```bash
yarn gateway:start
```
This starts the HTTP gateway server on port 8080 that coordinates communication between the frontend and agents.

#### Terminal 3: Start the Frontend
```bash
yarn dev
```
This starts the Next.js frontend development server on port 3000.

### 6. Access the application

The application will be available at [http://localhost:3000](http://localhost:3000).

**Important**: All three services must be running for the application to work properly.

### 7. Using the application

1. **Enter Stock Symbols**: Type any stock symbols you want to analyze (e.g., AAPL, GOOGL, MSFT)
2. **Run Analysis**: Click "Run A2A Workflow" to see the agents collaborate
3. **View Results**: Watch real-time agent communication and analysis
4. **Export Reports**: Generate and download PDF reports of the analysis

## 🔧 Development

### Project Structure

```
fin-studio/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and A2A client
│   ├── types/               # TypeScript type definitions
│   ├── agents/              # AI agent implementations
│   └── utils/               # Helper utilities
├── dist/                    # Compiled agents
├── package.json
├── tsconfig.json
├── tsconfig.agents.json     # Separate config for agents
├── tailwind.config.js
├── next.config.js
└── README.md
```

### Available Scripts

- `yarn dev` - Start the frontend development server
- `yarn build` - Build the frontend for production
- `yarn start` - Start the production frontend server
- `yarn agents:build` - Compile the TypeScript agents to JavaScript
- `yarn agents:start` - Start the agent manager and all agents
- `yarn gateway:start` - Start the HTTP gateway server
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking

### A2A Protocol Implementation

The platform implements Google Cloud's A2A protocol for agent communication:

1. **Agent Registration**: Agents register with the central registry
2. **Service Discovery**: Agents can discover other agents and their capabilities
3. **Message Routing**: Messages are routed between agents via HTTP gateway
4. **Error Handling**: Robust error handling and retry mechanisms
5. **Monitoring**: Real-time agent status and metrics

### Architecture Overview

The system uses a modern HTTP-based architecture:

```
Frontend (Next.js) → Gateway Server → AI Agents
     ↓                    ↓              ↓
Port 3000            Port 8080    Ports 8081-8084
```

- **Frontend**: User interface and interaction
- **Gateway**: HTTP API that coordinates agent communication
- **Agents**: Specialized AI agents for different analysis tasks

### Adding New Agents

1. Create a new agent class in `src/agents/`
2. Implement the required interfaces from `src/types/a2a.ts`
3. Register the agent in `src/agents/manager.ts`
4. Add the agent to the port configuration

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

## 🌐 API Integration

### OpenAI Configuration

The platform uses OpenAI GPT-4 for analysis. Make sure to:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file
3. Monitor your usage and costs

### Market Data Sources

The platform uses OpenAI's search capabilities to gather market data and insights:

- **OpenAI Search**: Real-time market data and news through OpenAI's search functionality
- **AI-Powered Analysis**: All market analysis powered by OpenAI GPT-4
- **Comprehensive Coverage**: Market data, news, economic indicators, and technical analysis
- **No External APIs**: Simplified setup with only OpenAI API key required

## 🔐 Security

- API keys are stored securely in environment variables
- A2A communication uses secure WebSocket connections
- Input validation on all agent interactions
- Error handling prevents information leakage

## 📊 Monitoring and Debugging

### Agent Status

Monitor agent health via the dashboard:
- Real-time connection status
- Message processing metrics
- Error rates and logs

### Debugging

Enable debug logging:

```bash
DEBUG=fin-studio:* yarn agents:start
```

Check agent logs in the console output.

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
yarn build
# Deploy to Vercel or your preferred platform
```

### Agent Manager Deployment

For production deployment:

1. Build the agents: `yarn agents:build`
2. Deploy the `dist/` folder to your server
3. Set up environment variables
4. Start with process manager (PM2, Docker, etc.)

### Docker Support

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8080-8084
CMD ["node", "dist/agents/manager.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -am 'Add new feature'`
5. Push: `git push origin feature/new-feature`
6. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔮 Roadmap

- [ ] Enhanced chart visualization
- [ ] Portfolio management features
- [ ] Real-time notifications
- [ ] Mobile app support
- [ ] Advanced ML models
- [ ] API webhooks
- [ ] Multi-user support
- [ ] Advanced security features

## ⚡ Performance Tips

1. **Agent Optimization**: Agents process requests asynchronously
2. **Caching**: Market data is cached to reduce API calls
3. **Connection Pooling**: WebSocket connections are reused
4. **Rate Limiting**: Built-in rate limiting for API calls
