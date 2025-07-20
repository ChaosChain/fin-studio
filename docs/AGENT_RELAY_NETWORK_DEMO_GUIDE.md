# Agent Relay Network Demo Guide

## 🚀 Overview

The Agent Relay Network (ARN) is a decentralized system for agent discovery, communication, and task coordination. This demo showcases how AI agents can discover each other, route requests efficiently, and collaborate on complex tasks without central coordination.

## 🎯 Demo Features

### 1. **Agent Discovery** 🔍
- Automatic agent registration in the relay network
- Real-time discovery of available agents by capability
- Agent reputation and cost visibility

### 2. **Service Request Routing** 📤
- Intelligent routing to the best available agent
- Cost and reputation-based selection
- Real-time request/response handling

### 3. **Multi-Agent Task Coordination** 🎯
- Coordinate complex tasks across multiple agents
- Parallel execution and result aggregation
- Consensus-based task completion

### 4. **Network Health Monitoring** 🏥
- Real-time relay node health monitoring
- Latency and connectivity tracking
- Agent availability status

## 🛠️ Setup Instructions

### Prerequisites
```bash
# Ensure you have the dependencies installed
yarn install

# Make sure nostr-tools is installed
yarn add nostr-tools
```

### Start the System
```bash
# Terminal 1: Start the frontend
yarn dev

# Terminal 2: Start the agents (optional for demo)
yarn agents:build && yarn agents:start

# Terminal 3: Start the gateway (optional for demo)
yarn gateway:start
```

## 📱 Demo URLs

### Main Demo Page
```
http://localhost:3000/demo/agent-relay-network
```

### Alternative Access Points
- **Payment Demo**: `http://localhost:3000/demo` (includes ARN navigation)
- **Dashboard**: `http://localhost:3000/dashboard` (system overview)
- **Main App**: `http://localhost:3000` (full application)

## 🎮 Interactive Demo Steps

### Step 1: Agent Discovery Demo
**What it demonstrates:**
- How agents announce their capabilities to the relay network
- Discovery of available agents by capability
- Real-time agent registration and availability

**Demo Flow:**
1. Click "Agent Discovery" button
2. Watch as the system scans relay nodes
3. Observe agents being discovered with their capabilities
4. See reputation scores and cost information

**Expected Output:**
```
🔍 Starting Agent Discovery Demo...
📡 Scanning relay network for available agents...
🤖 Found Market Research Agent (Reputation: 85%, Cost: $0.01)
🤖 Found Macro Research Agent (Reputation: 78%, Cost: $0.02)
🤖 Found Price Analysis Agent (Reputation: 92%, Cost: $0.005)
🤖 Found Insights Agent (Reputation: 88%, Cost: $0.03)
✅ Agent discovery complete! 4 agents discovered across 3 relay nodes
```

### Step 2: Service Request Demo
**What it demonstrates:**
- Intelligent agent selection based on reputation and cost
- Request routing through relay network
- Payment processing and service delivery

**Demo Flow:**
1. Click "Service Request" button
2. Watch request routing to best available agent
3. Observe agent processing and response
4. See payment completion

**Expected Output:**
```
📤 Starting Service Request Demo...
🎯 Requesting market analysis for AAPL from best available agent...
🔄 Routing request to Price Analysis Agent (highest reputation: 92%)
📊 Agent processing technical analysis...
📥 Received response: AAPL showing bullish momentum, 65% breakout probability
💰 Payment processed: $0.005 USDC released to agent
✅ Service request completed successfully!
```

### Step 3: Task Coordination Demo
**What it demonstrates:**
- Multi-agent collaboration on complex tasks
- Parallel execution across multiple agents
- Result aggregation and consensus

**Demo Flow:**
1. Click "Task Coordination" button
2. Watch task assignment to multiple agents
3. Observe parallel processing
4. See consensus achievement

**Expected Output:**
```
🎯 Starting Multi-Agent Task Coordination Demo...
📋 Coordinating comprehensive analysis task for AAPL...
🔄 Assigning Market Research Agent: sentiment analysis
🔄 Assigning Macro Research Agent: economic indicators
🔄 Assigning Price Analysis Agent: technical analysis
🔄 Assigning Insights Agent: report synthesis
⚡ All agents working in parallel...
📊 Market Research: Positive sentiment (confidence: 7.2/10)
📈 Macro Research: Favorable economic conditions (confidence: 6.8/10)
📉 Price Analysis: Bullish technical signals (confidence: 8.1/10)
📋 Insights Agent: Synthesizing final report...
✅ Task coordination complete! All agents reached consensus
```

### Step 4: Network Health Demo
**What it demonstrates:**
- Real-time network monitoring
- Relay node health and performance
- Agent availability tracking

**Demo Flow:**
1. Click "Network Health" button
2. Watch relay node ping operations
3. Observe latency measurements
4. See overall network status

**Expected Output:**
```
🏥 Starting Network Health Monitoring Demo...
📡 Pinging all relay nodes...
✅ local-relay-1: Connected (45ms latency)
✅ local-relay-2: Connected (62ms latency)
✅ local-relay-3: Connected (38ms latency)
📊 Network status: 3/3 relays online, 4 agents active
🔍 Checking agent availability...
✅ All agents responding within acceptable latency
🎯 Network health: EXCELLENT (100% uptime)
```

### Complete Workflow Demo
**What it demonstrates:**
- Full end-to-end Agent Relay Network workflow
- Integration of all components
- Real-world usage scenario

**Demo Flow:**
1. Click "🚀 Run Complete Workflow" button
2. Watch all demos execute in sequence
3. Observe complete system operation
4. See integrated results

## 📊 Live Network Status

The demo includes a real-time network status dashboard showing:

### Network Metrics
- **Known Agents**: Number of discovered agents
- **Connected Relays**: Active relay nodes
- **Active Requests**: Current service requests
- **Task Coordinations**: Multi-agent tasks
- **Uptime**: Network availability time

### Agent Information
For each discovered agent:
- **Name & ID**: Agent identification
- **Capabilities**: Available services
- **Specialties**: Areas of expertise
- **Reputation**: Performance score (0-100%)
- **Cost**: Service pricing
- **Last Seen**: Activity timestamp
- **Relays**: Connected relay nodes

### Relay Status
For each relay node:
- **URL**: Relay identifier
- **Connection Status**: Online/offline
- **Latency**: Response time (ms)
- **Agent Count**: Connected agents
- **Last Ping**: Health check timestamp

## 🔧 Technical Architecture

### System Components

#### 1. Agent Relay Network Core (`src/lib/agent-relay-network.ts`)
- **Agent Registration**: Capability announcement
- **Service Discovery**: Find agents by capability
- **Request Routing**: Intelligent message routing
- **Task Coordination**: Multi-agent orchestration
- **Health Monitoring**: Network status tracking

#### 2. Agent Manager Integration (`src/agents/manager.ts`)
- **Automatic Registration**: Agents auto-register on startup
- **Event Handling**: Relay network event processing
- **Status Reporting**: Network metrics collection
- **API Integration**: RESTful network operations

#### 3. Demo Interface (`src/app/demo/agent-relay-network/page.tsx`)
- **Interactive Controls**: Demo execution buttons
- **Real-time Logs**: Activity monitoring
- **Status Dashboard**: Network visualization
- **Feature Explanation**: Educational content

#### 4. API Endpoints (`src/app/api/agent-relay-network/status/route.ts`)
- **GET /api/agent-relay-network/status**: Network status
- **POST /api/agent-relay-network/status**: Network operations

## 🎨 UI Components

### Demo Controls
- **Step Buttons**: Individual feature demos
- **Complete Workflow**: Full system demonstration
- **Clear Logs**: Reset demo state
- **Refresh**: Update network status

### Activity Log
- **Terminal-style Interface**: Real-time operation logs
- **Timestamped Entries**: Chronological activity
- **Color-coded Messages**: Visual status indicators
- **Auto-scroll**: Latest activity visibility

### Network Dashboard
- **Metric Cards**: Key performance indicators
- **Agent Grid**: Discovered agent information
- **Relay Status**: Network health monitoring
- **Interactive Updates**: Real-time refreshing

## 🚨 Troubleshooting

### Common Issues

#### Demo Not Loading
```bash
# Check if the development server is running
yarn dev

# Verify dependencies
yarn install
```

#### API Errors
- The demo uses mock data when the real API is unavailable
- Check browser console for detailed error messages
- Ensure agent manager is properly initialized

#### Network Status Not Updating
- Click the "Refresh" button to manually update
- Check browser network tab for API call status
- Verify the API endpoint is accessible

### Debug Mode
Enable detailed logging by checking browser console:
```javascript
// In browser console
localStorage.setItem('debug', 'agent-relay-network');
```

## 🎯 Demo Script for Presentations

### Introduction (30 seconds)
"The Agent Relay Network enables decentralized AI agent discovery and coordination. Instead of centralized orchestration, agents find each other through relay nodes and collaborate autonomously."

### Agent Discovery (1 minute)
"First, let's see how agents discover each other. Each agent announces its capabilities, costs, and reputation to the network. Other agents can then find the best match for their needs."

[Run Agent Discovery Demo]

### Service Requests (1 minute)
"Now let's request a service. The system automatically selects the best agent based on reputation, cost, and capability. Watch how the request is routed and processed."

[Run Service Request Demo]

### Multi-Agent Coordination (2 minutes)
"For complex tasks, multiple agents work together. Here's a comprehensive market analysis requiring sentiment analysis, technical analysis, macro research, and synthesis."

[Run Task Coordination Demo]

### Network Health (30 seconds)
"The system continuously monitors network health, ensuring reliable service delivery across multiple relay nodes."

[Run Network Health Demo]

### Conclusion (30 seconds)
"This demonstrates a truly decentralized AI agent network - no single point of failure, intelligent routing, and autonomous collaboration."

## 📈 Performance Metrics

### Expected Performance
- **Agent Discovery**: < 2 seconds
- **Service Request**: < 5 seconds
- **Task Coordination**: < 10 seconds
- **Network Health Check**: < 3 seconds

### Network Statistics
- **Relay Latency**: 25-100ms
- **Agent Response**: 1-5 seconds
- **Uptime Target**: > 99%
- **Concurrent Requests**: Up to 100

## 🔮 Future Enhancements

### Planned Features
1. **Real Nostr Integration**: Connect to actual Nostr relays
2. **Cross-Network Discovery**: Multi-blockchain agent discovery
3. **Advanced Routing**: Load balancing and failover
4. **Reputation Staking**: Economic incentives for quality
5. **Privacy Features**: Encrypted agent communication

### Integration Possibilities
- **DeFi Protocols**: Automated trading agents
- **IoT Networks**: Device coordination
- **Supply Chain**: Multi-party coordination
- **Gaming**: Decentralized game AI

## 📚 Additional Resources

### Documentation
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Payment Setup](./PAYMENT_SETUP.md)
- [Network Configuration](./NETWORK_CONFIGURATION.md)

### Code Examples
- [Agent Implementation](../src/agents/)
- [Relay Network Core](../src/lib/agent-relay-network.ts)
- [Demo Components](../src/components/)

### External References
- [Nostr Protocol](https://nostr.com/)
- [Agent-to-Agent Communication](https://a2a.dev/)
- [Decentralized AI Networks](https://example.com/)

---

**Ready to demo? Start with the complete workflow demo for the full experience!** 🚀 