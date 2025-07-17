# OpenAI API Cost Tracking System

## Overview

This system tracks and reports the costs associated with OpenAI API usage across all agents in the fin-studio application. It provides detailed cost breakdowns, token usage analytics, and helps monitor AI spending in real-time.

## Features

### ✅ Real-time Cost Tracking
- **Per-request tracking**: Each OpenAI API call is tracked individually
- **Token usage monitoring**: Separate tracking for input and output tokens
- **Duration tracking**: Response time measurement for performance analysis
- **Agent-specific costs**: Breakdown by individual agent (Market Research, Macro Research, Price Analysis, Insights)

### 📊 Comprehensive Reporting
- **Total cost calculation**: Aggregated cost across all agents
- **Token usage statistics**: Input vs output token analysis
- **Cost per agent**: Individual agent cost breakdown
- **Average cost per request**: Performance metrics per agent
- **Session duration tracking**: Time from start to completion

### 💰 Current Pricing (April 2025)
- **GPT-4 Input**: $0.01 per 1,000 tokens
- **GPT-4 Output**: $0.03 per 1,000 tokens
- **GPT-4o Input**: $0.005 per 1,000 tokens  
- **GPT-4o Output**: $0.015 per 1,000 tokens

## How It Works

### 1. Cost Tracking Integration
Each agent integrates the cost tracker at the OpenAI API call level:

```typescript
// Track costs for each API call
const startTime = Date.now();
const response = await this.openai.chat.completions.create({...});
const duration = Date.now() - startTime;

const usage = extractTokenUsage(response);
const requestCost = costTracker.trackRequest(
  this.identity.id,
  this.identity.name,
  this.generateId(),
  'action_name',
  'gpt-4',
  usage,
  duration
);
```

### 2. Cost Information Flow
1. **Agent Level**: Each agent tracks its OpenAI API calls
2. **Response Embedding**: Cost info is embedded in agent responses
3. **Frontend Aggregation**: The workflow component collects and aggregates costs
4. **Real-time Display**: Costs are displayed after workflow completion

### 3. Cost Report Components

#### Summary Cards
- **Total Cost**: Complete session cost in USD
- **Total Tokens**: Input + Output token counts
- **API Requests**: Number of OpenAI API calls made
- **Session Duration**: Time from start to finish

#### Cost Breakdown
- **Input Tokens**: Cost for prompt tokens
- **Output Tokens**: Cost for completion tokens
- **Agent Usage**: Per-agent cost analysis

#### Usage Insights
- **Cost efficiency**: Per-request averages
- **Token distribution**: Input vs output ratios
- **Most expensive agent**: Highest cost contributor

## Agent-Specific Usage

### Market Research Agent
- **News Analysis**: ~2,000-3,000 tokens per request
- **Company Research**: ~3,000-4,000 tokens per request
- **Sentiment Analysis**: ~2,000-3,000 tokens per request
- **Typical Cost**: $0.05-0.15 per request

### Macro Research Agent
- **Economic Indicators**: ~3,000-4,000 tokens per request
- **Inflation Analysis**: ~3,000-4,000 tokens per request
- **Typical Cost**: $0.08-0.20 per request

### Price Analysis Agent
- **Market Data**: ~3,000-4,000 tokens per request
- **Technical Analysis**: ~3,000-4,000 tokens per request
- **Risk Assessment**: ~1,500-2,000 tokens per request
- **Typical Cost**: $0.05-0.15 per request

### Insights Agent
- **Daily Insights**: ~2,000-2,500 tokens per request
- **Report Generation**: ~2,000-2,500 tokens per request
- **Typical Cost**: $0.05-0.10 per request

## Usage Example

### Running a Full Workflow
When you run the complete agent workflow:

1. **Market Research Agent** analyzes market sentiment
2. **Macro Research Agent** analyzes economic indicators  
3. **Price Analysis Agent** gets market data
4. **Insights Agent** generates daily insights

**Total Expected Cost**: $0.20-0.60 per workflow run
**Total Tokens**: ~10,000-15,000 tokens
**Duration**: 30-60 seconds

### Cost Report Display
After completion, you'll see:
```
=== OpenAI API Cost Report ===
Total Cost: $0.45
Total Tokens: 12,543
Total Requests: 4
Session Duration: 45.2s

=== Agent Breakdown ===
Market Research Agent: $0.15 (3,421 tokens)
Macro Research Agent: $0.12 (2,987 tokens)
Price Analysis Agent: $0.10 (2,764 tokens)
Insights Agent: $0.08 (2,371 tokens)
```

## Cost Optimization Tips

### 1. Token Management
- **Shorter prompts**: Reduce input token costs
- **Focused responses**: Limit max_tokens parameter
- **Efficient prompting**: Use clear, concise instructions

### 2. Model Selection
- **GPT-4 vs GPT-4o**: Consider newer models for better cost efficiency
- **Context length**: Optimize for your use case

### 3. Request Optimization
- **Batch similar requests**: Reduce API call overhead
- **Cache responses**: Avoid duplicate API calls
- **Selective agents**: Only run necessary agents

## Monitoring and Budgeting

### Cost Alerts
- Monitor per-session costs
- Track monthly usage patterns
- Set budget thresholds

### Performance Metrics
- **Cost per insight**: Value measurement
- **Token efficiency**: Output quality vs cost
- **Agent performance**: Cost vs value analysis

## Technical Implementation

### Key Files
- `src/lib/cost-tracker.ts`: Core cost tracking logic
- `src/components/CostReport.tsx`: UI cost display
- `src/components/AgentWorkflow.tsx`: Cost aggregation
- `src/agents/*.ts`: Agent-level cost integration

### Data Flow
1. **Agent execution**: OpenAI API calls tracked
2. **Cost calculation**: Token usage × pricing
3. **Response embedding**: Cost info in responses
4. **Frontend collection**: Aggregate all costs
5. **Report generation**: Display comprehensive breakdown

## Future Enhancements

- **Historical tracking**: Long-term cost analysis
- **Budget management**: Spending limits and alerts
- **Cost optimization**: Automated efficiency suggestions
- **Export capabilities**: CSV/PDF cost reports
- **Real-time monitoring**: Live cost tracking dashboard

---

This cost tracking system provides full transparency into OpenAI API usage, helping you optimize AI spending while maintaining high-quality financial analysis capabilities. 