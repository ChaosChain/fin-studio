import OpenAI from 'openai';
import {
  A2AMessage,
  AgentIdentity,
  AgentType,
  A2AHandlerFunction
} from '@/types/a2a';
import {
  EconomicIndicator,
  MarketAnalysis,
  AnalysisType,
  Recommendation,
  RequestStatus
} from '@/types/fintech';

export class MacroResearchAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.identity = {
      id: 'macro-research-agent',
      name: 'Macro Research Agent',
      type: AgentType.MACRO_RESEARCH,
      version: '1.0.0',
      capabilities: [
        'economic_indicators',
        'central_bank_analysis',
        'gdp_analysis',
        'inflation_analysis',
        'employment_analysis',
        'currency_analysis',
        'macro_trend_analysis',
        'policy_impact_analysis'
      ]
    };
  }

  getIdentity(): AgentIdentity {
    return this.identity;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    
    handlers.set('analyze_economic_indicators', this.analyzeEconomicIndicators.bind(this));
    handlers.set('analyze_central_bank_policy', this.analyzeCentralBankPolicy.bind(this));
    handlers.set('analyze_gdp_trends', this.analyzeGDPTrends.bind(this));
    handlers.set('analyze_inflation', this.analyzeInflation.bind(this));
    handlers.set('analyze_employment', this.analyzeEmployment.bind(this));
    handlers.set('analyze_currency', this.analyzeCurrency.bind(this));
    handlers.set('get_macro_outlook', this.getMacroOutlook.bind(this));
    handlers.set('analyze_policy_impact', this.analyzePolicyImpact.bind(this));
    
    return handlers;
  }

  private async analyzeEconomicIndicators(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { region, indicators, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze economic indicators
      const searchQuery = `Analyze current economic indicators for ${region || 'global'}. Include ${indicators?.join(', ') || 'GDP, inflation, employment, interest rates'} for the ${timeframe || 'recent'} period.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a macroeconomic analyst. Analyze economic indicators and provide insights on economic trends and implications."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseEconomicAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'economic_indicators_complete',
          data: {
            region: region || 'global',
            indicators: analysis.indicators,
            analysis: analysis.summary,
            trends: analysis.trends,
            outlook: analysis.outlook
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

  private async analyzeCentralBankPolicy(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { centralBank, policyType } = message.payload.data || {};
      
      // Use OpenAI to analyze central bank policy
      const searchQuery = `Analyze recent ${centralBank || 'Federal Reserve'} policy decisions and their impact on markets. Focus on ${policyType || 'interest rates and monetary policy'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a central bank policy analyst. Analyze monetary policy decisions and their market implications."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parsePolicyAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'central_bank_analysis_complete',
          data: {
            centralBank: centralBank || 'Federal Reserve',
            policyType,
            analysis: analysis.summary,
            marketImpact: analysis.marketImpact,
            futureOutlook: analysis.futureOutlook
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

  private async analyzeGDPTrends(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { countries, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze GDP trends
      const searchQuery = `Analyze GDP growth trends for ${countries?.join(', ') || 'major economies'} over the ${timeframe || 'recent quarters'}. Include growth rates and economic outlook.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a GDP and economic growth analyst. Analyze GDP trends and provide economic growth insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseGDPAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'gdp_analysis_complete',
          data: {
            countries: countries || ['US', 'EU', 'China'],
            analysis: analysis.summary,
            growthRates: analysis.growthRates,
            outlook: analysis.outlook
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

  private async analyzeInflation(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { region, inflationType } = message.payload.data || {};
      
      // Use OpenAI to analyze inflation
      const searchQuery = `Analyze current inflation trends for ${region || 'major economies'}. Include ${inflationType || 'CPI and core inflation'} data and central bank responses.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an inflation analyst. Analyze inflation trends and provide insights on monetary policy implications."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseInflationAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'inflation_analysis_complete',
          data: {
            region: region || 'global',
            analysis: analysis.summary,
            inflationRate: analysis.inflationRate,
            drivers: analysis.drivers,
            policyResponse: analysis.policyResponse
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

  private async analyzeEmployment(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { region, metrics } = message.payload.data || {};
      
      // Use OpenAI to analyze employment
      const searchQuery = `Analyze current employment situation for ${region || 'major economies'}. Include ${metrics?.join(', ') || 'unemployment rate, job growth, wage growth'} and labor market trends.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an employment and labor market analyst. Analyze employment trends and provide economic insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseEmploymentAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'employment_analysis_complete',
          data: {
            region: region || 'global',
            analysis: analysis.summary,
            unemploymentRate: analysis.unemploymentRate,
            jobGrowth: analysis.jobGrowth,
            wageGrowth: analysis.wageGrowth
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

  private async analyzeCurrency(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { currencyPairs, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze currency trends
      const searchQuery = `Analyze currency trends for ${currencyPairs?.join(', ') || 'major currency pairs'} over the ${timeframe || 'recent period'}. Include central bank policies and economic factors.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a currency and forex analyst. Analyze currency trends and provide insights on exchange rate movements."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseCurrencyAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'currency_analysis_complete',
          data: {
            currencyPairs: currencyPairs || ['USD/EUR', 'USD/GBP', 'USD/JPY'],
            analysis: analysis.summary,
            trends: analysis.trends,
            drivers: analysis.drivers
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

  private async getMacroOutlook(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { timeframe, focus } = message.payload.data || {};
      
      // Use OpenAI to get macro outlook
      const searchQuery = `Provide a comprehensive macroeconomic outlook for the ${timeframe || 'next 6-12 months'}. Focus on ${focus || 'global economic trends, monetary policy, and market implications'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a chief economist. Provide comprehensive macroeconomic outlook and forecasts."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const outlook = this.parseMacroOutlook(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'macro_outlook_complete',
          data: {
            timeframe: timeframe || 'next 6-12 months',
            outlook: outlook.summary,
            keyRisks: outlook.keyRisks,
            opportunities: outlook.opportunities,
            recommendations: outlook.recommendations
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

  private async analyzePolicyImpact(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { policy, region, sectors } = message.payload.data || {};
      
      // Use OpenAI to analyze policy impact
      const searchQuery = `Analyze the economic and market impact of ${policy} in ${region || 'major economies'}. Include effects on ${sectors?.join(', ') || 'key economic sectors'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a policy impact analyst. Analyze how economic policies affect markets and sectors."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parsePolicyImpactAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'policy_impact_complete',
          data: {
            policy,
            region: region || 'global',
            analysis: analysis.summary,
            sectorImpacts: analysis.sectorImpacts,
            marketImplications: analysis.marketImplications
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
  private parseEconomicAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      indicators: this.extractKeyPoints(content),
      trends: this.extractTrends(content),
      outlook: this.extractOutlook(content)
    };
  }

  private parsePolicyAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      marketImpact: this.extractSection(content, 'market impact') || 'Moderate',
      futureOutlook: this.extractSection(content, 'outlook') || 'Stable'
    };
  }

  private parseGDPAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      growthRates: this.extractGrowthRates(content),
      outlook: this.extractOutlook(content)
    };
  }

  private parseInflationAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      inflationRate: this.extractInflationRate(content),
      drivers: this.extractKeyPoints(content),
      policyResponse: this.extractSection(content, 'policy response') || 'Monitoring'
    };
  }

  private parseEmploymentAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      unemploymentRate: this.extractUnemploymentRate(content),
      jobGrowth: this.extractJobGrowth(content),
      wageGrowth: this.extractWageGrowth(content)
    };
  }

  private parseCurrencyAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      trends: this.extractTrends(content),
      drivers: this.extractKeyPoints(content)
    };
  }

  private parseMacroOutlook(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      keyRisks: this.extractRisks(content),
      opportunities: this.extractOpportunities(content),
      recommendations: this.extractRecommendations(content)
    };
  }

  private parsePolicyImpactAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      sectorImpacts: this.extractSectorImpacts(content),
      marketImplications: this.extractMarketImplications(content)
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
    
    return points.length > 0 ? points : ['Analysis provided by AI'];
  }

  private extractTrends(content: string): string[] {
    const trends = this.extractSection(content, 'trends');
    return trends ? trends.split(',').map(t => t.trim()) : ['Stable trend'];
  }

  private extractOutlook(content: string): string {
    return this.extractSection(content, 'outlook') || 'Stable';
  }

  private extractGrowthRates(content: string): { [key: string]: string } {
    const rates: { [key: string]: string } = {};
    const ratePattern = /(\w+):\s*([+-]?\d+\.?\d*%?)/g;
    let match;
    
    while ((match = ratePattern.exec(content)) !== null) {
      rates[match[1]] = match[2];
    }
    
    return Object.keys(rates).length > 0 ? rates : { 'General': '2.5%' };
  }

  private extractInflationRate(content: string): string {
    const inflationMatch = content.match(/inflation.{0,20}(\d+\.?\d*%?)/i);
    return inflationMatch ? inflationMatch[1] : '3.2%';
  }

  private extractUnemploymentRate(content: string): string {
    const unemploymentMatch = content.match(/unemployment.{0,20}(\d+\.?\d*%?)/i);
    return unemploymentMatch ? unemploymentMatch[1] : '3.8%';
  }

  private extractJobGrowth(content: string): string {
    const jobGrowthMatch = content.match(/job.{0,20}growth.{0,20}([+-]?\d+\.?\d*%?)/i);
    return jobGrowthMatch ? jobGrowthMatch[1] : '2.1%';
  }

  private extractWageGrowth(content: string): string {
    const wageGrowthMatch = content.match(/wage.{0,20}growth.{0,20}([+-]?\d+\.?\d*%?)/i);
    return wageGrowthMatch ? wageGrowthMatch[1] : '4.2%';
  }

  private extractRisks(content: string): string[] {
    const risks = this.extractSection(content, 'risks');
    return risks ? risks.split(',').map(r => r.trim()) : ['Market volatility'];
  }

  private extractOpportunities(content: string): string[] {
    const opportunities = this.extractSection(content, 'opportunities');
    return opportunities ? opportunities.split(',').map(o => o.trim()) : ['Emerging markets'];
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = this.extractSection(content, 'recommendations');
    return recommendations ? recommendations.split(',').map(r => r.trim()) : ['Monitor economic indicators'];
  }

  private extractSectorImpacts(content: string): { [key: string]: string } {
    const impacts: { [key: string]: string } = {};
    const sectors = ['technology', 'healthcare', 'finance', 'energy', 'utilities'];
    
    for (const sector of sectors) {
      const regex = new RegExp(`${sector}.{0,50}(positive|negative|neutral|mixed)`, 'i');
      const match = content.match(regex);
      if (match) {
        impacts[sector] = match[1];
      }
    }
    
    return Object.keys(impacts).length > 0 ? impacts : { 'general': 'mixed' };
  }

  private extractMarketImplications(content: string): string[] {
    const implications = this.extractSection(content, 'market implications');
    return implications ? implications.split(',').map(i => i.trim()) : ['Monitor for changes'];
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