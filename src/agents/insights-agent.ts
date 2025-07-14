import OpenAI from 'openai';
import {
  A2AMessage,
  AgentIdentity,
  AgentType,
  A2AHandlerFunction
} from '@/types/a2a';
import {
  MarketAnalysis,
  AnalysisType,
  Recommendation,
  Sentiment,
  RequestStatus
} from '@/types/fintech';

export class InsightsAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.identity = {
      id: 'insights-agent',
      name: 'Insights Agent',
      type: AgentType.INSIGHTS_REPORTER,
      version: '1.0.0',
      capabilities: [
        'daily_insights',
        'market_summary',
        'cross_agent_analysis',
        'report_generation',
        'trend_synthesis',
        'alert_management',
        'user_communications',
        'portfolio_insights'
      ]
    };
  }

  getIdentity(): AgentIdentity {
    return this.identity;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    
    handlers.set('generate_daily_insights', this.generateDailyInsights.bind(this));
    handlers.set('create_market_summary', this.createMarketSummary.bind(this));
    handlers.set('synthesize_analysis', this.synthesizeAnalysis.bind(this));
    handlers.set('generate_report', this.generateReport.bind(this));
    handlers.set('create_alert', this.createAlert.bind(this));
    handlers.set('get_portfolio_insights', this.getPortfolioInsights.bind(this));
    handlers.set('aggregate_data', this.aggregateData.bind(this));
    
    return handlers;
  }

  private async generateDailyInsights(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { focus, timeframe } = message.payload.data || {};
      
      // Use OpenAI to generate comprehensive daily insights
      const searchQuery = `Generate comprehensive daily market insights for ${focus || 'global markets'}. Include key market movements, economic developments, sector performance, and investment implications for ${timeframe || 'today'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a senior market analyst. Generate comprehensive daily insights combining market data, economic trends, and investment recommendations."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 2000,
      });

      const insights = this.parseInsights(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'daily_insights_complete',
          data: {
            insights: insights.summary,
            keyPoints: insights.keyPoints,
            marketOutlook: insights.outlook,
            recommendations: insights.recommendations,
            riskFactors: insights.risks
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async createMarketSummary(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { markets, timeframe } = message.payload.data || {};
      
      // Use OpenAI to create market summary
      const searchQuery = `Create a comprehensive market summary for ${markets?.join(', ') || 'major global markets'} covering ${timeframe || 'today'}. Include index performance, sector rotation, volume analysis, and key market drivers.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a market summary specialist. Create concise but comprehensive market summaries highlighting key developments and trends."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const summary = this.parseMarketSummary(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'market_summary_complete',
          data: {
            summary: summary.overview,
            performance: summary.performance,
            keyDrivers: summary.drivers,
            sectorHighlights: summary.sectors,
            outlook: summary.outlook
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async synthesizeAnalysis(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { analysisData, focusAreas } = message.payload.data || {};
      
      // Use OpenAI to synthesize analysis from multiple sources
      const synthesisQuery = `Synthesize the following analysis data into coherent investment insights: ${JSON.stringify(analysisData)}. Focus on ${focusAreas?.join(', ') || 'key investment themes and risk factors'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a synthesis expert. Combine multiple analysis sources into coherent, actionable investment insights."
          },
          {
            role: "user",
            content: synthesisQuery
          }
        ],
        max_tokens: 1500,
      });

      const synthesis = this.parseSynthesis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'synthesis_complete',
          data: {
            synthesis: synthesis.summary,
            keyThemes: synthesis.themes,
            consensus: synthesis.consensus,
            conflicts: synthesis.conflicts,
            recommendations: synthesis.recommendations
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async generateReport(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { reportType, data, audience } = message.payload.data || {};
      
      // Use OpenAI to generate formatted report
      const reportQuery = `Generate a ${reportType || 'comprehensive market'} report for ${audience || 'institutional investors'}. Include the following data: ${JSON.stringify(data)}. Format as a professional investment report with executive summary, key findings, and recommendations.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional report writer. Create well-structured, professional investment reports with clear sections and actionable insights."
          },
          {
            role: "user",
            content: reportQuery
          }
        ],
        max_tokens: 2000,
      });

      const report = this.parseReport(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'report_complete',
          data: {
            report: report.content,
            executiveSummary: report.summary,
            keyFindings: report.findings,
            recommendations: report.recommendations,
            appendix: report.appendix
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async createAlert(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { alertType, thresholds, symbols } = message.payload.data || {};
      
      // Use OpenAI to create intelligent alert
      const alertQuery = `Create an intelligent ${alertType || 'market'} alert for ${symbols?.join(', ') || 'major market instruments'}. Monitor for ${JSON.stringify(thresholds)} and provide context and recommendations when triggered.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an alert system designer. Create intelligent alerts that provide context and actionable recommendations."
          },
          {
            role: "user",
            content: alertQuery
          }
        ],
        max_tokens: 1000,
      });

      const alert = this.parseAlert(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'alert_created',
          data: {
            alertId: this.generateId(),
            alertType: alertType || 'market',
            configuration: alert.config,
            message: alert.message,
            recommendations: alert.recommendations
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async getPortfolioInsights(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { portfolioData, benchmarks } = message.payload.data || {};
      
      // Use OpenAI to analyze portfolio insights
      const portfolioQuery = `Analyze portfolio performance and provide insights: ${JSON.stringify(portfolioData)}. Compare against ${benchmarks?.join(', ') || 'major market indices'} and provide optimization recommendations.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a portfolio analyst. Provide comprehensive portfolio insights including performance analysis, risk assessment, and optimization recommendations."
          },
          {
            role: "user",
            content: portfolioQuery
          }
        ],
        max_tokens: 1500,
      });

      const insights = this.parsePortfolioInsights(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'portfolio_insights_complete',
          data: {
            performance: insights.performance,
            riskAnalysis: insights.risk,
            attribution: insights.attribution,
            recommendations: insights.recommendations,
            rebalancing: insights.rebalancing
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async aggregateData(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { dataSources, aggregationType } = message.payload.data || {};
      
      // Use OpenAI to aggregate and analyze data
      const aggregationQuery = `Aggregate and analyze data from multiple sources: ${JSON.stringify(dataSources)}. Perform ${aggregationType || 'comprehensive'} aggregation and identify key patterns, trends, and insights.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a data aggregation specialist. Combine data from multiple sources and extract meaningful insights and patterns."
          },
          {
            role: "user",
            content: aggregationQuery
          }
        ],
        max_tokens: 1500,
      });

      const aggregation = this.parseAggregation(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'aggregation_complete',
          data: {
            aggregatedData: aggregation.data,
            patterns: aggregation.patterns,
            trends: aggregation.trends,
            insights: aggregation.insights,
            confidence: aggregation.confidence
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  // Helper methods for parsing OpenAI responses
  private parseInsights(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      keyPoints: this.extractKeyPoints(content),
      outlook: this.extractOutlook(content),
      recommendations: this.extractRecommendations(content),
      risks: this.extractRisks(content)
    };
  }

  private parseMarketSummary(content: string): any {
    return {
      overview: this.extractSection(content, 'overview') || content.substring(0, 300),
      performance: this.extractPerformance(content),
      drivers: this.extractDrivers(content),
      sectors: this.extractSectors(content),
      outlook: this.extractOutlook(content)
    };
  }

  private parseSynthesis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      themes: this.extractThemes(content),
      consensus: this.extractConsensus(content),
      conflicts: this.extractConflicts(content),
      recommendations: this.extractRecommendations(content)
    };
  }

  private parseReport(content: string): any {
    return {
      content: content,
      summary: this.extractSection(content, 'executive summary') || content.substring(0, 200),
      findings: this.extractFindings(content),
      recommendations: this.extractRecommendations(content),
      appendix: this.extractAppendix(content)
    };
  }

  private parseAlert(content: string): any {
    return {
      config: this.extractAlertConfig(content),
      message: this.extractSection(content, 'message') || content.substring(0, 200),
      recommendations: this.extractRecommendations(content)
    };
  }

  private parsePortfolioInsights(content: string): any {
    return {
      performance: this.extractPerformance(content),
      risk: this.extractRiskAnalysis(content),
      attribution: this.extractAttribution(content),
      recommendations: this.extractRecommendations(content),
      rebalancing: this.extractRebalancing(content)
    };
  }

  private parseAggregation(content: string): any {
    return {
      data: this.extractAggregatedData(content),
      patterns: this.extractPatterns(content),
      trends: this.extractTrends(content),
      insights: this.extractInsights(content),
      confidence: this.extractConfidence(content)
    };
  }

  // Helper methods for extracting specific data
  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^\*/)) {
        const point = line.replace(/^\d+\.|^-|^\*/, '').trim();
        if (point) {
          points.push(point);
        }
      }
    }
    
    return points.length > 0 ? points : ['Market analysis provided'];
  }

  private extractOutlook(content: string): string {
    return this.extractSection(content, 'outlook') || 'Neutral';
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = this.extractSection(content, 'recommendations');
    return recommendations ? recommendations.split(',').map(r => r.trim()) : ['Monitor markets closely'];
  }

  private extractRisks(content: string): string[] {
    const risks = this.extractSection(content, 'risks');
    return risks ? risks.split(',').map(r => r.trim()) : ['Market volatility'];
  }

  private extractPerformance(content: string): { [key: string]: string } {
    const performance: { [key: string]: string } = {};
    const performancePattern = /([A-Z]{2,5}|S&P|Dow|Nasdaq):\s*([+-]?\d+\.?\d*%?)/g;
    let match;
    
    while ((match = performancePattern.exec(content)) !== null) {
      performance[match[1]] = match[2];
    }
    
    return Object.keys(performance).length > 0 ? performance : { 'Market': '+0.5%' };
  }

  private extractDrivers(content: string): string[] {
    const drivers = this.extractSection(content, 'drivers');
    return drivers ? drivers.split(',').map(d => d.trim()) : ['Economic data', 'Corporate earnings'];
  }

  private extractSectors(content: string): { [key: string]: string } {
    const sectors: { [key: string]: string } = {};
    const sectorPattern = /(Technology|Healthcare|Finance|Energy|Utilities|Consumer):\s*([^\n,]+)/gi;
    let match;
    
    while ((match = sectorPattern.exec(content)) !== null) {
      sectors[match[1]] = match[2].trim();
    }
    
    return Object.keys(sectors).length > 0 ? sectors : { 'Technology': 'Mixed' };
  }

  private extractThemes(content: string): string[] {
    const themes = this.extractSection(content, 'themes');
    return themes ? themes.split(',').map(t => t.trim()) : ['Market rotation', 'Interest rate sensitivity'];
  }

  private extractConsensus(content: string): string {
    return this.extractSection(content, 'consensus') || 'Mixed views';
  }

  private extractConflicts(content: string): string[] {
    const conflicts = this.extractSection(content, 'conflicts');
    return conflicts ? conflicts.split(',').map(c => c.trim()) : ['Differing growth expectations'];
  }

  private extractFindings(content: string): string[] {
    const findings = this.extractSection(content, 'findings');
    return findings ? findings.split(',').map(f => f.trim()) : ['Market conditions stable'];
  }

  private extractAppendix(content: string): string {
    return this.extractSection(content, 'appendix') || 'Additional data available upon request';
  }

  private extractAlertConfig(content: string): any {
    return {
      type: 'market',
      frequency: 'daily',
      triggers: ['price movement > 2%', 'volume spike > 50%']
    };
  }

  private extractRiskAnalysis(content: string): any {
    return {
      volatility: this.extractSection(content, 'volatility') || '15%',
      beta: this.extractSection(content, 'beta') || '1.2',
      maxDrawdown: this.extractSection(content, 'drawdown') || '12%'
    };
  }

  private extractAttribution(content: string): any {
    return {
      selection: this.extractSection(content, 'selection') || '+1.2%',
      allocation: this.extractSection(content, 'allocation') || '+0.8%',
      interaction: this.extractSection(content, 'interaction') || '+0.3%'
    };
  }

  private extractRebalancing(content: string): any {
    return {
      frequency: 'quarterly',
      triggers: ['drift > 5%', 'market signals'],
      recommendations: this.extractRecommendations(content)
    };
  }

  private extractAggregatedData(content: string): any {
    return {
      summary: content.substring(0, 200),
      dataPoints: this.extractKeyPoints(content).length,
      quality: 'high'
    };
  }

  private extractPatterns(content: string): string[] {
    const patterns = this.extractSection(content, 'patterns');
    return patterns ? patterns.split(',').map(p => p.trim()) : ['Upward trend', 'Cyclical rotation'];
  }

  private extractTrends(content: string): string[] {
    const trends = this.extractSection(content, 'trends');
    return trends ? trends.split(',').map(t => t.trim()) : ['Bullish momentum', 'Sector rotation'];
  }

  private extractInsights(content: string): string[] {
    const insights = this.extractSection(content, 'insights');
    return insights ? insights.split(',').map(i => i.trim()) : ['Market remains resilient'];
  }

  private extractConfidence(content: string): number {
    const confidenceMatch = content.match(/confidence:?\s*(\d+)/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.8;
  }

  private createErrorResponse(originalMessage: A2AMessage, error: Error): A2AMessage {
    return {
      id: this.generateId(),
      type: 'error' as any,
      timestamp: new Date(),
      source: this.identity,
      target: originalMessage.source,
      payload: {
        action: 'error',
        data: {
          error: error.message,
          originalAction: originalMessage.payload.action
        },
        context: originalMessage.payload.context
      },
      metadata: {
        responseToMessageId: originalMessage.id
      }
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 