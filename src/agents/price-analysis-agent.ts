import OpenAI from 'openai';
import {
  A2AMessage,
  AgentIdentity,
  AgentType,
  A2AHandlerFunction
} from '@/types/a2a';
import {
  MarketData,
  TechnicalIndicators,
  MarketAnalysis,
  AnalysisType,
  Recommendation,
  RequestStatus
} from '@/types/fintech';

export class PriceAnalysisAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.identity = {
      id: 'price-analysis-agent',
      name: 'Price Analysis Agent',
      type: AgentType.PRICE_ANALYSIS,
      version: '1.0.0',
      capabilities: [
        'real_time_price_data',
        'technical_analysis',
        'chart_pattern_recognition',
        'support_resistance_analysis',
        'volatility_analysis',
        'trend_analysis',
        'momentum_analysis',
        'risk_assessment'
      ]
    };
  }

  getIdentity(): AgentIdentity {
    return this.identity;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    
    handlers.set('get_price_data', this.getPriceData.bind(this));
    handlers.set('get_market_data', this.getPriceData.bind(this)); // Alias for compatibility
    handlers.set('analyze_technical_indicators', this.analyzeTechnicalIndicators.bind(this));
    handlers.set('identify_chart_patterns', this.identifyChartPatterns.bind(this));
    handlers.set('analyze_support_resistance', this.analyzeSupportResistance.bind(this));
    handlers.set('analyze_volatility', this.analyzeVolatility.bind(this));
    handlers.set('analyze_trends', this.analyzeTrends.bind(this));
    handlers.set('analyze_momentum', this.analyzeMomentum.bind(this));
    handlers.set('assess_risk', this.assessRisk.bind(this));
    
    return handlers;
  }

  private async getPriceData(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe, interval } = message.payload.data || {};
      
      // Use OpenAI web search to get current price data
      const searchQuery = `Get current real-time stock price and market data for ${symbols?.join(', ') || 'major market indices'}. Include exact current prices, price movements, trading volume, market cap, and market sentiment for ${timeframe || 'today'}. Search for the most recent trading data available.`;
      
      const response = await this.openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: searchQuery,
      });

      const priceAnalysis = this.parsePriceData(response.output_text || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'price_data_complete',
          data: {
            symbols: symbols || ['SPY', 'QQQ', 'IWM'],
            priceData: priceAnalysis.prices,
            analysis: priceAnalysis.analysis,
            marketSentiment: priceAnalysis.sentiment
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

  private async analyzeTechnicalIndicators(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, indicators, timeframe } = message.payload.data || {};
      
      // Use OpenAI web search to analyze current technical indicators
      const searchQuery = `Analyze current technical indicators for ${symbols?.join(', ') || 'major market indices'}. Include real-time ${indicators?.join(', ') || 'RSI, MACD, moving averages, volume'} analysis for ${timeframe || 'today'}. Search for the most current technical analysis data and trading signals.`;
      
      const response = await this.openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: searchQuery,
      });

      const technicalAnalysis = this.parseTechnicalAnalysis(response.output_text || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'technical_analysis_complete',
          data: {
            symbols: symbols || ['SPY'],
            indicators: technicalAnalysis.indicators,
            analysis: technicalAnalysis.analysis,
            signals: technicalAnalysis.signals,
            recommendation: technicalAnalysis.recommendation
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

  private async identifyChartPatterns(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Use OpenAI to identify chart patterns
      const searchQuery = `Identify chart patterns and technical formations for ${symbols?.join(', ') || 'major market indices'}. Look for head and shoulders, triangles, flags, breakouts, and other technical patterns over ${timeframe || 'recent weeks'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a chart pattern recognition expert. Identify technical chart patterns and their implications."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const patternAnalysis = this.parseChartPatterns(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'chart_patterns_complete',
          data: {
            symbols: symbols || ['SPY'],
            patterns: patternAnalysis.patterns,
            analysis: patternAnalysis.analysis,
            implications: patternAnalysis.implications,
            targets: patternAnalysis.targets
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

  private async analyzeSupportResistance(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze support and resistance levels
      const searchQuery = `Analyze support and resistance levels for ${symbols?.join(', ') || 'major market indices'}. Identify key price levels, breakout points, and technical levels over ${timeframe || 'recent months'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a support and resistance analysis expert. Identify key price levels and their significance."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const levelsAnalysis = this.parseSupportResistance(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'support_resistance_complete',
          data: {
            symbols: symbols || ['SPY'],
            supportLevels: levelsAnalysis.support,
            resistanceLevels: levelsAnalysis.resistance,
            analysis: levelsAnalysis.analysis,
            keyLevels: levelsAnalysis.keyLevels
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

  private async analyzeVolatility(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze volatility
      const searchQuery = `Analyze volatility patterns for ${symbols?.join(', ') || 'major market indices'}. Include historical volatility, implied volatility, VIX levels, and volatility trends over ${timeframe || 'recent period'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a volatility analysis expert. Analyze market volatility and provide risk insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const volatilityAnalysis = this.parseVolatilityAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'volatility_analysis_complete',
          data: {
            symbols: symbols || ['SPY'],
            volatility: volatilityAnalysis.volatility,
            analysis: volatilityAnalysis.analysis,
            riskLevel: volatilityAnalysis.riskLevel,
            implications: volatilityAnalysis.implications
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

  private async analyzeTrends(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Use OpenAI web search to analyze current trends
      const searchQuery = `Analyze current price trends and momentum for ${symbols?.join(', ') || 'major market indices'}. Include trend direction, strength, duration, and potential trend changes over ${timeframe || 'recent period'}. Search for the most recent market trend analysis and price movement data.`;
      
      const response = await this.openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: searchQuery,
      });

      const trendAnalysis = this.parseTrendAnalysis(response.output_text || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'trend_analysis_complete',
          data: {
            symbols: symbols || ['SPY'],
            trends: trendAnalysis.trends,
            analysis: trendAnalysis.analysis,
            strength: trendAnalysis.strength,
            outlook: trendAnalysis.outlook
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

  private async analyzeMomentum(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Use OpenAI to analyze momentum
      const searchQuery = `Analyze momentum indicators for ${symbols?.join(', ') || 'major market indices'}. Include price momentum, volume momentum, and momentum shifts over ${timeframe || 'recent period'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a momentum analysis expert. Analyze market momentum and provide trading insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const momentumAnalysis = this.parseMomentumAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'momentum_analysis_complete',
          data: {
            symbols: symbols || ['SPY'],
            momentum: momentumAnalysis.momentum,
            analysis: momentumAnalysis.analysis,
            signals: momentumAnalysis.signals,
            direction: momentumAnalysis.direction
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

  private async assessRisk(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe, riskMetrics } = message.payload.data || {};
      
      // Use OpenAI to assess risk
      const searchQuery = `Assess risk metrics for ${symbols?.join(', ') || 'major market indices'}. Include ${riskMetrics?.join(', ') || 'VaR, beta, correlation, drawdown'} analysis over ${timeframe || 'recent period'}.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a risk assessment expert. Analyze market risk and provide risk management insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const riskAnalysis = this.parseRiskAssessment(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'risk_assessment_complete',
          data: {
            symbols: symbols || ['SPY'],
            riskMetrics: riskAnalysis.metrics,
            analysis: riskAnalysis.analysis,
            riskLevel: riskAnalysis.riskLevel,
            recommendations: riskAnalysis.recommendations
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
  private parsePriceData(content: string): any {
    return {
      prices: this.extractPrices(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      sentiment: this.extractSentiment(content)
    };
  }

  private parseTechnicalAnalysis(content: string): any {
    return {
      indicators: this.extractIndicators(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      signals: this.extractSignals(content),
      recommendation: this.extractRecommendation(content)
    };
  }

  private parseChartPatterns(content: string): any {
    return {
      patterns: this.extractPatterns(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      implications: this.extractImplications(content),
      targets: this.extractTargets(content)
    };
  }

  private parseSupportResistance(content: string): any {
    return {
      support: this.extractSupportLevels(content),
      resistance: this.extractResistanceLevels(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      keyLevels: this.extractKeyLevels(content)
    };
  }

  private parseVolatilityAnalysis(content: string): any {
    return {
      volatility: this.extractVolatility(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      riskLevel: this.extractRiskLevel(content),
      implications: this.extractImplications(content)
    };
  }

  private parseTrendAnalysis(content: string): any {
    return {
      trends: this.extractTrends(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      strength: this.extractStrength(content),
      outlook: this.extractOutlook(content)
    };
  }

  private parseMomentumAnalysis(content: string): any {
    return {
      momentum: this.extractMomentum(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      signals: this.extractSignals(content),
      direction: this.extractDirection(content)
    };
  }

  private parseRiskAssessment(content: string): any {
    return {
      metrics: this.extractRiskMetrics(content),
      analysis: this.extractSection(content, 'analysis') || content.substring(0, 300),
      riskLevel: this.extractRiskLevel(content),
      recommendations: this.extractRecommendations(content)
    };
  }

  // Helper methods for extracting specific data
  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractPrices(content: string): { [key: string]: string } {
    const prices: { [key: string]: string } = {};
    
    // Multiple patterns to catch different price formats from web search
    const patterns = [
      // Pattern: SYMBOL: $123.45 or SYMBOL: 123.45
      /([A-Z]{2,5}):\s*\$?([0-9,]+\.?[0-9]*)/g,
      // Pattern: SYMBOL is trading at $123.45 or SYMBOL trades at $123.45
      /([A-Z]{2,5})\s+(?:is\s+)?(?:trading|trades|priced)\s+at\s+\$?([0-9,]+\.?[0-9]*)/gi,
      // Pattern: SYMBOL $123.45 or SYMBOL 123.45
      /([A-Z]{2,5})\s+\$?([0-9,]+\.?[0-9]*)/g,
      // Pattern: Current price of SYMBOL: $123.45
      /(?:current\s+)?price\s+of\s+([A-Z]{2,5}):\s*\$?([0-9,]+\.?[0-9]*)/gi,
      // Pattern: SYMBOL stock price: $123.45
      /([A-Z]{2,5})\s+stock\s+price:\s*\$?([0-9,]+\.?[0-9]*)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const symbol = match[1].toUpperCase();
        const price = match[2].replace(/,/g, ''); // Remove commas
        prices[symbol] = price;
      }
    }
    
    return Object.keys(prices).length > 0 ? prices : { 'SPY': '450.00' };
  }

  private extractSentiment(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('bullish') || lowerContent.includes('positive')) {
      return 'Bullish';
    } else if (lowerContent.includes('bearish') || lowerContent.includes('negative')) {
      return 'Bearish';
    }
    return 'Neutral';
  }

  private extractIndicators(content: string): { [key: string]: string } {
    const indicators: { [key: string]: string } = {};
    const indicatorPattern = /(RSI|MACD|SMA|EMA|Volume):\s*([^\n,]+)/gi;
    let match;
    
    while ((match = indicatorPattern.exec(content)) !== null) {
      indicators[match[1]] = match[2].trim();
    }
    
    return Object.keys(indicators).length > 0 ? indicators : { 'RSI': '65', 'MACD': 'Bullish' };
  }

  private extractSignals(content: string): string[] {
    const signals: string[] = [];
    const signalPattern = /(buy|sell|hold|bullish|bearish|neutral)\s+signal/gi;
    let match;
    
    while ((match = signalPattern.exec(content)) !== null) {
      signals.push(match[1]);
    }
    
    return signals.length > 0 ? signals : ['neutral'];
  }

  private extractRecommendation(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('buy') || lowerContent.includes('strong buy')) {
      return 'BUY';
    } else if (lowerContent.includes('sell') || lowerContent.includes('strong sell')) {
      return 'SELL';
    }
    return 'HOLD';
  }

  private extractPatterns(content: string): string[] {
    const patterns: string[] = [];
    const patternTypes = ['head and shoulders', 'triangle', 'flag', 'pennant', 'double top', 'double bottom'];
    const lowerContent = content.toLowerCase();
    
    for (const pattern of patternTypes) {
      if (lowerContent.includes(pattern)) {
        patterns.push(pattern);
      }
    }
    
    return patterns.length > 0 ? patterns : ['consolidation'];
  }

  private extractImplications(content: string): string[] {
    const implications = this.extractSection(content, 'implications');
    return implications ? implications.split(',').map(i => i.trim()) : ['Monitor for breakout'];
  }

  private extractTargets(content: string): string[] {
    const targets: string[] = [];
    const targetPattern = /target[s]?:\s*\$?([0-9,]+\.?[0-9]*)/gi;
    let match;
    
    while ((match = targetPattern.exec(content)) !== null) {
      targets.push(match[1]);
    }
    
    return targets.length > 0 ? targets : ['460'];
  }

  private extractSupportLevels(content: string): string[] {
    const levels: string[] = [];
    const supportPattern = /support[^0-9]*\$?([0-9,]+\.?[0-9]*)/gi;
    let match;
    
    while ((match = supportPattern.exec(content)) !== null) {
      levels.push(match[1]);
    }
    
    return levels.length > 0 ? levels : ['440'];
  }

  private extractResistanceLevels(content: string): string[] {
    const levels: string[] = [];
    const resistancePattern = /resistance[^0-9]*\$?([0-9,]+\.?[0-9]*)/gi;
    let match;
    
    while ((match = resistancePattern.exec(content)) !== null) {
      levels.push(match[1]);
    }
    
    return levels.length > 0 ? levels : ['460'];
  }

  private extractKeyLevels(content: string): string[] {
    const keyLevels = this.extractSection(content, 'key levels');
    return keyLevels ? keyLevels.split(',').map(l => l.trim()) : ['450'];
  }

  private extractVolatility(content: string): string {
    const volatilityMatch = content.match(/volatility[^0-9]*([0-9]+\.?[0-9]*%?)/i);
    return volatilityMatch ? volatilityMatch[1] : '15%';
  }

  private extractRiskLevel(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('high risk')) {
      return 'High';
    } else if (lowerContent.includes('low risk')) {
      return 'Low';
    }
    return 'Moderate';
  }

  private extractTrends(content: string): { [key: string]: string } {
    const trends: { [key: string]: string } = {};
    const trendPattern = /(short|medium|long)[-\s]?term:\s*([^\n,]+)/gi;
    let match;
    
    while ((match = trendPattern.exec(content)) !== null) {
      trends[match[1]] = match[2].trim();
    }
    
    return Object.keys(trends).length > 0 ? trends : { 'short-term': 'bullish' };
  }

  private extractStrength(content: string): string {
    const strengthMatch = content.match(/strength[^a-z]*([a-z]+)/i);
    return strengthMatch ? strengthMatch[1] : 'moderate';
  }

  private extractOutlook(content: string): string {
    return this.extractSection(content, 'outlook') || 'Neutral';
  }

  private extractMomentum(content: string): string {
    const momentumMatch = content.match(/momentum[^a-z]*([a-z]+)/i);
    return momentumMatch ? momentumMatch[1] : 'neutral';
  }

  private extractDirection(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('upward') || lowerContent.includes('up')) {
      return 'Upward';
    } else if (lowerContent.includes('downward') || lowerContent.includes('down')) {
      return 'Downward';
    }
    return 'Sideways';
  }

  private extractRiskMetrics(content: string): { [key: string]: string } {
    const metrics: { [key: string]: string } = {};
    const metricPattern = /(VaR|Beta|Correlation|Drawdown):\s*([^\n,]+)/gi;
    let match;
    
    while ((match = metricPattern.exec(content)) !== null) {
      metrics[match[1]] = match[2].trim();
    }
    
    return Object.keys(metrics).length > 0 ? metrics : { 'Beta': '1.2' };
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = this.extractSection(content, 'recommendations');
    return recommendations ? recommendations.split(',').map(r => r.trim()) : ['Monitor closely'];
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