# Agent Relay Network - Quick Start Guide

## 🚀 Quick Start

### What is ARN?
The **Agent Relay Network** is a decentralized system that coordinates 16 AI agents to perform comprehensive financial analysis. It automatically discovers, selects, and orchestrates the best agents for each task based on capabilities and reputation.

### Key Benefits
- **🤖 16 Specialized Agents**: 4 base + 8 model variants + 4 verifiers
- **⚡ Automatic Coordination**: No manual agent selection needed
- **🛡️ Built-in Verification**: Consensus-driven results
- **💰 Cost Optimized**: Selects best agents by performance/cost ratio

---

## 📱 Using ARN in the Demo

### 1. Access the Demo
```
http://localhost:3000/chaos-demo
```

### 2. View ARN Status
Scroll to the **"Agent Relay Network"** section to see:
- **16 Total Agents** across 3 relay nodes
- **Real-time metrics** (active requests, reputation scores)
- **Agent categories** (Base, Model Variants, Verifiers)

### 3. Run Analysis with ARN
1. Select a symbol (BTC, ETH, AAPL, etc.)
2. Click **"🚀 Start Analysis"**
3. Watch ARN coordinate agents in real-time
4. View comprehensive results with agent contributions

### 4. Interactive Features
- **🚀 Quick Demo**: Shows ARN coordination workflow
- **Expandable Lists**: Click "+4 more variants" to see all agents
- **Live Updates**: Real-time network status and metrics

---

## 💻 Developer Integration

### Basic Usage

```typescript
import { agentManager } from '@/agents/manager';

// Run ARN-coordinated analysis
const result = await agentManager.requestComprehensiveAnalysis(
  ['BTC'], 
  'comprehensive',
  { useARN: true }  // Enable ARN coordination
);
```

### Agent Discovery

```typescript
import { agentRelayNetwork } from '@/lib/agent-relay-network';

// Find agents by capability
const techAgents = await agentRelayNetwork.discoverAgents(['technical_analysis']);
const sentimentAgents = await agentRelayNetwork.discoverAgents(['market_sentiment']);

// Get network status
const status = agentRelayNetwork.getNetworkStatus();
console.log(`${status.knownAgents} agents available`);
```

### Custom Agent Registration

```typescript
// Register your custom agent
const customAgent = {
  agentId: 'my-custom-agent',
  name: 'My Custom Agent',
  capabilities: ['custom_analysis'],
  reputation: 0.8,
  cost: '$0.02',
  endpoint: 'http://localhost:8090'
};

await agentRelayNetwork.announceAgent(customAgent);
```

---

## 🔧 API Endpoints

### GET `/api/agent-relay-network/status`
Returns complete ARN status including all agents, relays, and metrics.

```bash
curl "http://localhost:3000/api/agent-relay-network/status" | jq '.data.knownAgents | length'
# Returns: 16
```

### POST `/api/agent-relay-network/status`
Supports actions: `discover_agents`, `request_service`, `coordinate_task`, `find_best_agent`

```typescript
// Discover agents
const response = await fetch('/api/agent-relay-network/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'discover_agents',
    payload: { capabilities: ['technical_analysis'] }
  })
});
```

---

## 🧪 Testing

### Run ARN Tests
```bash
yarn test:arn
```

### Test Results
```
✅ Passed: 10/10
• Agent Registration: All 16 agents registered
• Agent Discovery: Capability matching works  
• Task Coordination: Multi-agent orchestration functional
• Network Status: Health monitoring active
```

---

## 🐛 Troubleshooting

### Common Issues

#### ARN Shows "Loading..."
```bash
# Check API status
curl "http://localhost:3000/api/agent-relay-network/status" | jq '.success'

# Verify agent count  
curl "http://localhost:3000/api/agent-relay-network/status" | jq '.data.knownAgents | length'
```

#### React Errors
Ensure arrays are converted to numbers in components:
```typescript
activeRequests: Array.isArray(data.activeRequests) 
  ? data.activeRequests.length 
  : (data.activeRequests || 0)
```

#### Agents Not Registering
```typescript
// Check if agent manager is running
if (!agentManager.getIsRunning()) {
  await agentManager.initialize();
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

---

## 📚 Agent Categories

### 🤖 Base Agents (4)
- **Market Research**: News analysis, sentiment, trends
- **Macro Research**: Economic indicators, policy analysis
- **Price Analysis**: Technical analysis, price assessment  
- **Insights**: Report generation, recommendations

### ⚡ Model Variants (8)
- **GPT-4 Variants (4)**: High precision analysis
- **GPT-4O Variants (4)**: Speed-optimized analysis

### 🛡️ Verifier Agents (4)
- **Verifier 1-4**: Quality assurance, consensus building
- **High Reputation**: 93-96% reliability
- **Low Cost**: $0.001 per verification

---

## 🔗 Related Documentation

- **[Complete ARN Documentation](./AGENT_RELAY_NETWORK.md)**: Full technical details
- **[Test Suite Documentation](./ARN_TEST_SUITE.md)**: Testing guide
- **[Architecture Guide](./TECHNICAL_ARCHITECTURE.md)**: System design

---

## 💡 Tips

1. **Use ARN for Complex Analysis**: Best for multi-component financial analysis
2. **Monitor Network Health**: Check relay status and agent reputation
3. **Leverage Agent Diversity**: Different models provide varied perspectives
4. **Trust the Verification**: Verifier agents ensure result quality
5. **Cost Optimization**: ARN automatically selects cost-effective agents

**Ready to get started? Visit `http://localhost:3000/chaos-demo` and explore the ARN in action!** 🚀 