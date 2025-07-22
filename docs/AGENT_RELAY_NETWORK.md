# Agent Relay Network (ARN) Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technical Implementation](#technical-implementation)
4. [User Guide](#user-guide)
5. [API Reference](#api-reference)
6. [Integration Guide](#integration-guide)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The **Agent Relay Network (ARN)** is a decentralized multi-agent AI collaboration system that enables autonomous agent discovery, communication, and task coordination across distributed networks. It serves as the backbone for ChaosChain's comprehensive financial analysis workflow, coordinating 16 specialized AI agents to deliver consensus-driven investment insights.

### Key Features

- **🌐 Decentralized Agent Discovery**: Automatic discovery of available agents by capabilities and specialties
- **🤖 Multi-Agent Coordination**: Orchestrates complex tasks across multiple AI agents simultaneously
- **🛡️ Reputation-Based Selection**: Chooses optimal agents based on historical performance and reputation scores
- **⚡ Real-Time Communication**: Enables direct agent-to-agent communication through relay nodes
- **📊 Network Health Monitoring**: Tracks relay status, latency, and network connectivity
- **🔄 Fault Tolerance**: Automatic failover and retry mechanisms for robust operation
- **💰 Cost Optimization**: Selects agents based on cost-effectiveness and performance metrics

### Agent Types

The ARN manages 16 specialized agents organized into three categories:

#### **Base Agents (4)**
Core analysis agents that perform primary financial analysis:
- **Market Research Agent**: News analysis, market sentiment, trend analysis
- **Macro Research Agent**: Economic indicators, policy analysis, macro trends  
- **Price Analysis Agent**: Technical analysis, chart patterns, price assessment
- **Insights Agent**: Report generation, synthesis, strategic recommendations

#### **Model Variants (8)**
Specialized versions using different AI models for enhanced analysis:
- **GPT-4 Variants (4)**: Higher precision, detailed analysis capabilities
- **GPT-4O Variants (4)**: Optimized for speed and efficiency

#### **Verifier Agents (4)**
Consensus and validation network:
- **Verifier 1-4**: Quality assurance, accuracy verification, consensus building

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Relay Network                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Relay 1   │  │   Relay 2   │  │   Relay 3   │         │
│  │  (Local)    │  │  (Local)    │  │  (Local)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    Agent Discovery                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Capability Matching | Reputation Scoring | Cost Analysis│ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Agent Network                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Base Agents  │  │Model        │  │Verifier     │         │
│  │    (4)      │  │Variants (8) │  │Agents (4)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Network Topology

The ARN operates on a hybrid architecture combining:

1. **Centralized Discovery**: Agent registration and capability matching
2. **Decentralized Communication**: Direct agent-to-agent messaging via relays
3. **Distributed Consensus**: Multi-agent verification and reputation tracking

### Data Flow

```
User Request → Task Decomposition → Agent Discovery → Task Coordination
     ↓
Agent Selection → Parallel Execution → Verification → Consensus
     ↓
Reputation Update → Payment Release → Result Aggregation
```

---

## Technical Implementation

### Core Components

#### 1. Agent Relay Network Core (`src/lib/agent-relay-network.ts`)

```typescript
class AgentRelayNetwork extends EventEmitter {
  private knownAgents: Map<string, AgentProfile>;
  private relays: string[];
  private activeRequests: Map<string, AgentRequest>;
  private taskCoordinations: Map<string, TaskCoordination>;
  private relayStatus: Map<string, RelayStatus>;
  
  // Core methods
  async start(): Promise<void>
  async announceAgent(agent: AgentProfile): Promise<void>
  async discoverAgents(capabilities?: string[]): Promise<AgentProfile[]>
  async requestAgentService(request: AgentRequest): Promise<string>
  async coordinateTask(taskId: string, agents: string[], taskData: any): Promise<void>
}
```

**Key Features:**
- **Event-driven architecture** for real-time updates
- **Agent lifecycle management** (registration, discovery, cleanup)
- **Request routing and coordination**
- **Network health monitoring**

#### 2. Agent Manager Integration (`src/agents/manager.ts`)

```typescript
class AgentManager extends EventEmitter {
  // ARN Integration Methods
  async initializeAgentRelayNetwork(): Promise<void>
  async registerAgentsInRelayNetwork(): Promise<void>
  async discoverAndSelectAgentsViaARN(taskExecution: TaskExecution): Promise<void>
  async coordinateTaskViaARN(taskExecution: TaskExecution): Promise<void>
  async executeARNCoordinatedAnalysis(taskExecution: TaskExecution): Promise<void>
  
  // Agent Discovery and Selection
  async discoverAgentsByCapability(capabilities: string[]): Promise<AgentProfile[]>
  selectBestAgentsForComponent(agents: AgentProfile[], capability: string, count: number): AgentConfig[]
  async requestAgentServiceViaRelay(taskType: string, payload: any, targetAgent?: string, maxCost?: string): Promise<string>
}
```

**Integration Features:**
- **Comprehensive analysis workflow** with ARN coordination
- **Multi-model agent deployment** (GPT-4, GPT-4O variants)
- **Reputation-based agent selection**
- **Automatic fallback mechanisms**

#### 3. Frontend Components

##### ARN Integration Demo (`src/components/ARNIntegrationDemo.tsx`)

```typescript
interface ARNMetrics {
  networkStatus: {
    isRunning: boolean;
    connectedRelays: number;
    totalRelays: number;
    knownAgents: number;
    activeRequests: number;
  };
  knownAgents: AgentProfile[];
  relayStatus: RelayStatus[];
}

export default function ARNIntegrationDemo({ isActive }: { isActive: boolean }) {
  // Real-time data fetching and display
  // Agent categorization and visualization
  // Interactive demos and network status
}
```

**UI Features:**
- **Real-time network metrics** (agents, relays, requests)
- **Agent categorization** by type and model
- **Interactive expansion** of agent details
- **Live status indicators** and health monitoring
- **Demo coordination** showing ARN in action

### Agent Registration Process

```typescript
// 1. Base Agent Registration
for (const [agentId, agent] of this.agents) {
  const agentProfile: AgentProfile = {
    agentId: agent.getIdentity().id,
    name: agent.getIdentity().name,
    capabilities: agent.getIdentity().capabilities,
    reputation: agentReputationNetwork.getReputation(agentId)?.reputationScore || 0.5,
    cost: this.getAgentCost(agentId),
    endpoint: `http://localhost:${this.ports.get(agentId)}`,
    relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
  };
  
  await agentRelayNetwork.announceAgent(agentProfile);
}

// 2. Model Variant Registration
const baseAgentTypes = ['market-research-agent', 'macro-research-agent', 'price-analysis-agent', 'insights-agent'];
const models = ['gpt4', 'gpt4o'];

for (const baseType of baseAgentTypes) {
  for (const model of models) {
    const variantId = `${baseType}-${model}`;
    // Create and register variant profile
  }
}

// 3. Verifier Agent Registration
for (let i = 1; i <= 4; i++) {
  const verifierAgent = new VerifierAgent(i.toString());
  // Register verifier with specialized capabilities
}
```

### Task Coordination Workflow

```typescript
// ARN-Enhanced Comprehensive Analysis
async requestComprehensiveAnalysis(symbols: string[], analysisType: string, options: { useARN: boolean }) {
  if (options.useARN) {
    // 1. ARN Agent Discovery and Selection
    await this.discoverAndSelectAgentsViaARN(taskExecution);
    
    // 2. ARN Task Coordination
    await this.coordinateTaskViaARN(taskExecution);
    
    // 3. ARN-Coordinated Multi-Agent Analysis
    await this.executeARNCoordinatedAnalysis(taskExecution);
  }
  
  // 4. Verification by verifier network
  await this.performVerification(taskExecution);
  
  // 5. Consensus and payment release
  await this.processConsensusAndPayment(taskExecution);
}
```

### API Endpoints

#### GET `/api/agent-relay-network/status`

Returns comprehensive ARN status including:

```typescript
{
  success: true,
  data: {
    isRunning: boolean,
    connectedRelays: number,
    totalRelays: number,
    knownAgents: AgentProfile[],
    activeRequests: AgentRequest[],
    taskCoordinations: TaskCoordination[],
    relayStatus: RelayStatus[],
    uptime: number
  },
  timestamp: string
}
```

#### POST `/api/agent-relay-network/status`

Supports multiple actions:
- `discover_agents`: Find agents by capabilities
- `request_service`: Request specific agent services
- `coordinate_task`: Coordinate multi-agent tasks
- `find_best_agent`: Get optimal agent for task type

---

## User Guide

### Accessing the ARN Demo

1. **Navigate to ChaosChain Demo**: Visit `http://localhost:3000/chaos-demo`
2. **Locate ARN Section**: Scroll to the "Agent Relay Network" card
3. **View Network Status**: See real-time metrics for 16 agents across 3 relays

### Understanding the Interface

#### Network Overview
- **16 Total Agents**: Complete agent count across all categories
- **3/3 Relay Nodes**: Network connectivity status
- **Active Requests**: Current task coordination count
- **88% Avg Reputation**: Network-wide agent performance score

#### Agent Categories

##### **🤖 Base Agents (4)**
Core financial analysis agents:
- **Market Research**: Analyzes news, sentiment, and market trends
- **Macro Research**: Studies economic indicators and policy impacts
- **Price Analysis**: Performs technical analysis and price assessment
- **Insights**: Generates recommendations and strategic insights

##### **⚡ Model Variants (8)**
Specialized AI model implementations:
- **GPT-4 Variants**: High-precision analysis with detailed insights
- **GPT-4O Variants**: Speed-optimized for rapid analysis
- **Expandable View**: Click "+4 more variants" to see all model types

##### **🛡️ Verifier Agents (4)**
Consensus and validation network:
- **Verifier 1-4**: Ensure analysis quality and build consensus
- **High Reputation**: 93-96% reliability scores
- **Low Cost**: $0.001 per verification

##### **🔗 Relay Network (3)**
Infrastructure monitoring:
- **Connection Status**: All relays connected
- **Latency Metrics**: 40-85ms response times
- **Agent Distribution**: 16 agents per relay

### Running Comprehensive Analysis

1. **Select Symbol**: Choose from dropdown (BTC, ETH, AAPL, etc.)
2. **Click "Start Analysis"**: Initiates ARN-coordinated workflow
3. **Watch ARN Coordination**: Real-time updates show:
   - Agent discovery across relay network
   - Task assignment to multiple agents
   - Coordinated multi-agent analysis execution
   - Verification and consensus building
4. **View Results**: Complete analysis with agent contributions

### Interactive Features

#### **🚀 Quick Demo Button**
Demonstrates ARN coordination workflow:
- **Step 1**: "🔍 Discovering available agents across relay network..."
- **Step 2**: "🎯 Coordinating task assignment across multiple agents..."
- **Step 3**: "⚡ Executing coordinated multi-agent analysis..."
- **Step 4**: "✅ Analysis complete! Results verified and consensus reached."

#### **Expandable Agent Lists**
- **Model Variants**: Click to expand and see all 8 specialized variants
- **Real-time Updates**: Agent status updates every 30 seconds
- **Status Indicators**: Green/blue/purple dots show agent health

### Monitoring Network Health

#### **Live Metrics**
- **Agent Count**: Total registered agents
- **Relay Status**: Connection health and latency
- **Request Activity**: Current coordination tasks
- **Reputation Tracking**: Performance-based agent scoring

#### **Performance Indicators**
- **Response Times**: 40-85ms across relay network
- **Success Rates**: 93-96% consensus achievement
- **Cost Efficiency**: $0.001-$0.03 per agent operation
- **Network Uptime**: Continuous operation tracking

---

## API Reference

### Core Interfaces

#### AgentProfile
```typescript
interface AgentProfile {
  agentId: string;
  name: string;
  capabilities: string[];
  specialties: string[];
  reputation: number;
  cost: string;
  endpoint: string;
  publicKey: string;
  lastSeen: number;
  relays: string[];
}
```

#### AgentRequest
```typescript
interface AgentRequest {
  requestId: string;
  taskType: string;
  payload: any;
  targetAgent?: string;
  maxCost?: string;
  deadline: number;
  requesterPubkey: string;
  relays: string[];
}
```

#### TaskCoordination
```typescript
interface TaskCoordination {
  taskId: string;
  agents: string[];
  taskData: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  results: Map<string, any>;
}
```

### API Methods

#### Agent Discovery
```typescript
// Discover agents by capabilities
const agents = await agentRelayNetwork.discoverAgents(['technical_analysis', 'market_sentiment']);

// Find best agent for task
const bestAgent = agentRelayNetwork.findBestAgent('technical_analysis', '$0.05');
```

#### Service Requests
```typescript
// Request agent service
const requestId = await agentRelayNetwork.requestAgentService({
  requestId: 'req_' + Date.now(),
  taskType: 'technical_analysis',
  payload: { symbols: ['BTC'], taskId: 'task_123' },
  targetAgent: 'price-analysis-agent-gpt4',
  maxCost: '$0.05',
  deadline: Date.now() + 300000
});
```

#### Task Coordination
```typescript
// Coordinate multi-agent task
await agentRelayNetwork.coordinateTask(
  'task_123',
  ['agent1', 'agent2', 'agent3'],
  { symbols: ['BTC'], analysisType: 'comprehensive' }
);
```

---

## Integration Guide

### Adding ARN to Your Application

#### 1. Install Dependencies
```bash
# Core ARN functionality is built-in
# No additional dependencies required
```

#### 2. Initialize ARN
```typescript
import { agentRelayNetwork } from '@/lib/agent-relay-network';
import { agentManager } from '@/agents/manager';

// Start ARN
await agentRelayNetwork.start();

// Initialize agent manager with ARN
await agentManager.initialize();
```

#### 3. Register Custom Agents
```typescript
// Register your custom agent
const customAgent: AgentProfile = {
  agentId: 'my-custom-agent',
  name: 'My Custom Agent',
  capabilities: ['custom_analysis'],
  specialties: ['specialized_task'],
  reputation: 0.8,
  cost: '$0.02',
  endpoint: 'http://localhost:8090',
  publicKey: 'agent-key-' + Date.now(),
  lastSeen: Date.now(),
  relays: ['local-relay-1']
};

await agentRelayNetwork.announceAgent(customAgent);
```

#### 4. Use ARN in Analysis
```typescript
// Request comprehensive analysis with ARN
const result = await agentManager.requestComprehensiveAnalysis(
  ['BTC'], 
  'comprehensive',
  { useARN: true }
);
```

### Custom Agent Development

#### Creating a Custom Agent
```typescript
class CustomAgent {
  private identity: AgentIdentity;
  
  constructor() {
    this.identity = {
      id: 'custom-agent',
      name: 'Custom Analysis Agent',
      capabilities: ['custom_analysis', 'specialized_task'],
      type: AgentType.ANALYSIS
    };
  }
  
  getIdentity(): AgentIdentity {
    return this.identity;
  }
  
  async performAnalysis(symbols: string[], options: any): Promise<any> {
    // Custom analysis logic
    return {
      analysis: 'Custom analysis results',
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### Registering with ARN
```typescript
// Create and register custom agent
const customAgent = new CustomAgent();
agentManager.registerCustomAgent('custom-agent', customAgent);

// Agent will be automatically registered in ARN during initialization
```

---

## Testing

### Test Suite Overview

The ARN includes comprehensive tests covering:
- **Agent Registration**: Verify all 16 agents register correctly
- **Agent Discovery**: Test capability-based agent finding
- **Task Coordination**: Validate multi-agent task orchestration
- **Service Requests**: Test agent service request/response cycle
- **Network Status**: Monitor relay health and connectivity
- **Error Handling**: Ensure graceful failure recovery

### Running Tests

```bash
# Run ARN test suite
yarn test:arn

# Run specific test categories
yarn test:arn --grep "Agent Registration"
yarn test:arn --grep "Task Coordination"
```

### Test Results
```
📊 Test Summary:
✅ Passed: 10
❌ Failed: 0
📈 Total: 10

✅ Test Categories:
   • Agent Registration: All 16 agents registered
   • Agent Discovery: Capability matching works
   • Task Coordination: Multi-agent orchestration functional
   • Service Requests: Request/response cycle operational
   • Network Status: Health monitoring active
   • Relay Status: All 3 relays connected
   • Error Handling: Graceful failure recovery
   • Integration: ARN-coordinated analysis working
```

### Custom Test Development

```typescript
// Example custom test
test('should discover custom agents', async () => {
  // Register custom agent
  await arn.announceAgent(customAgentProfile);
  
  // Discover by capability
  const agents = await arn.discoverAgents(['custom_capability']);
  
  // Verify discovery
  expect(agents.length).toBeGreaterThan(0);
  expect(agents[0].capabilities).toContain('custom_capability');
});
```

---

## Troubleshooting

### Common Issues

#### 1. ARN Section Shows "Loading..."

**Symptoms**: ARN component stuck in loading state
**Causes**: 
- API endpoint not responding
- Data structure mismatch
- Network connectivity issues

**Solutions**:
```typescript
// Check API status
curl -s "http://localhost:3000/api/agent-relay-network/status" | jq '.success'

// Verify agent count
curl -s "http://localhost:3000/api/agent-relay-network/status" | jq '.data.knownAgents | length'

// Check console for errors
// Browser DevTools → Console → Look for ARN-related errors
```

#### 2. React Error: "Objects are not valid as a React child"

**Symptoms**: Runtime error when rendering ARN components
**Causes**: 
- Arrays being rendered directly instead of converted to counts
- Object data being passed to text elements

**Solutions**:
```typescript
// Ensure arrays are converted to numbers
activeRequests: Array.isArray(data.activeRequests) 
  ? data.activeRequests.length 
  : (data.activeRequests || 0)

// Transform data structure properly
const transformedData = {
  networkStatus: {
    knownAgents: data.knownAgents.length, // Convert array to count
    activeRequests: data.activeRequests.length // Convert array to count
  }
};
```

#### 3. Agents Not Registering

**Symptoms**: Agent count shows 0 or fewer than expected 16 agents
**Causes**:
- Agent Manager not initialized
- Registration timing issues
- Port conflicts

**Solutions**:
```typescript
// Check agent manager status
if (!agentManager.getIsRunning()) {
  await agentManager.initialize();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for registration
}

// Verify port assignments
this.ports.set('market-research-agent', 8081);
this.ports.set('macro-research-agent', 8082);
// ... ensure no conflicts
```

#### 4. Network Connectivity Issues

**Symptoms**: Relays showing as disconnected or high latency
**Causes**:
- Local network configuration
- Firewall blocking connections
- Resource constraints

**Solutions**:
```typescript
// Check relay status
const relayStatus = arn.getRelayStatus();
console.log('Relay Status:', relayStatus);

// Test connectivity
for (const relay of relays) {
  try {
    await fetch(relay.url);
    console.log(`✅ ${relay.url} connected`);
  } catch (error) {
    console.error(`❌ ${relay.url} failed:`, error);
  }
}
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```typescript
// Enable ARN debug logging
process.env.ARN_DEBUG = 'true';

// Check debug output
console.log('🔍 ARN Debug: Agent registration started');
console.log('🔍 ARN Debug: Network status:', arn.getNetworkStatus());
console.log('🔍 ARN Debug: Known agents:', arn.getKnownAgents().length);
```

### Performance Optimization

#### Reducing Load Times
```typescript
// Cache agent data
const agentCache = new Map();
const cachedAgents = agentCache.get('agents') || await arn.getKnownAgents();

// Optimize polling intervals
const interval = setInterval(fetchARNMetrics, 60000); // Reduce from 30s to 60s

// Implement lazy loading
const [showAllVariants, setShowAllVariants] = useState(false);
// Only render expanded view when requested
```

#### Memory Management
```typescript
// Clean up event listeners
useEffect(() => {
  const cleanup = () => {
    arn.removeAllListeners();
    clearInterval(pollingInterval);
  };
  
  return cleanup;
}, []);

// Limit stored data
const recentRequests = activeRequests.slice(-100); // Keep only recent 100
```

### Support and Reporting Issues

For additional support:

1. **Check Console Logs**: Browser DevTools → Console for ARN-related messages
2. **Verify API Endpoints**: Test `/api/agent-relay-network/status` directly
3. **Review Network Tab**: Check for failed API requests
4. **Test Environment**: Ensure development server is running on correct port
5. **Agent Status**: Verify all agents are properly initialized and registered

**Issue Reporting Template**:
```
## ARN Issue Report

**Environment**: 
- Node.js version: 
- Browser: 
- OS: 

**Symptoms**: 
[Describe the issue]

**Steps to Reproduce**: 
1. 
2. 
3. 

**Expected Behavior**: 
[What should happen]

**Actual Behavior**: 
[What actually happens]

**Console Logs**: 
```
[Include relevant console output]
```

**API Response**: 
```
[Include API response if relevant]
```
```

---

## Conclusion

The Agent Relay Network represents a significant advancement in decentralized AI coordination, enabling sophisticated multi-agent financial analysis through intelligent orchestration, reputation-based selection, and real-time collaboration. This documentation provides comprehensive coverage of both technical implementation and user interaction aspects, ensuring successful deployment and operation of ARN-powered applications.

For the latest updates and additional resources, refer to the ChaosChain technical documentation and community resources. 