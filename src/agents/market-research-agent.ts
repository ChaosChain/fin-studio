import OpenAI from 'openai';
import {
  A2AMessage,
  AgentIdentity,
  AgentType,
  A2AHandlerFunction
} from '@/types/a2a';
import {
  NewsArticle,
  MarketAnalysis,
  AnalysisType,
  Recommendation,
  Sentiment,
  MarketImpact,
  ResearchRequest,
  RequestStatus
} from '@/types/fintech';

export class MarketResearchAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    
    this.identity = {
      id: 'market-research-agent',
      name: 'Market Research Agent',
      type: AgentType.MARKET_RESEARCH,
      version: '1.0.0',
      capabilities: [
        'news_analysis',
        'market_sentiment',
        'trend_analysis',
        'company_research',
        'sector_analysis',
        'event_impact_analysis'
      ]
    };
  }

  getIdentity(): AgentIdentity {
    return this.identity;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    
    handlers.set('analyze_news', this.analyzeNews.bind(this));
    handlers.set('research_company', this.researchCompany.bind(this));
    handlers.set('analyze_market_sentiment', this.analyzeMarketSentiment.bind(this));
    handlers.set('analyze_sector', this.analyzeSector.bind(this));
    handlers.set('get_trending_topics', this.getTrendingTopics.bind(this));
    handlers.set('analyze_event_impact', this.analyzeEventImpact.bind(this));
    
    return handlers;
  }

  private async analyzeNews(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, keywords, timeframe } = message.payload.data || {};
      
      // Use OpenAI web search to analyze current news
      const searchQuery = this.buildSearchQuery(symbols, keywords, timeframe);
      const response = await this.openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: searchQuery,
      });

      const analysis = this.parseNewsAnalysis(response.output_text || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'news_analysis_complete',
          data: {
            analysis,
            summary: analysis.summary,
            sentiment: analysis.sentiment,
            marketImpact: analysis.marketImpact
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

  private async researchCompany(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbol, aspects } = message.payload.data || {};
      
      // Use OpenAI search to research company
      const searchQuery = `Research company ${symbol}. Include recent news, financial performance, stock analysis, and investment outlook.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst. Search for and analyze company information, providing comprehensive investment research."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseCompanyAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'company_research_complete',
          data: {
            symbol,
            analysis,
            recommendation: analysis.recommendation,
            confidence: analysis.confidence
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

  private async analyzeMarketSentiment(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { market, timeframe } = message.payload.data || {};
      
      // Use OpenAI web search to analyze current market sentiment
      const searchQuery = `Analyze current market sentiment for ${market}. Include recent news, investor sentiment, and market indicators. Search for the most recent market sentiment data and investor mood analysis.`;
      const response = await this.openai.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search_preview" }],
        input: searchQuery,
      });

      const sentimentAnalysis = this.parseSentimentAnalysis(response.output_text || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'market_sentiment_complete',
          data: {
            market,
            sentiment: sentimentAnalysis.sentiment,
            confidence: sentimentAnalysis.confidence,
            keyFactors: sentimentAnalysis.keyFactors,
            trend: sentimentAnalysis.trend
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

  private async analyzeSector(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { sector, metrics } = message.payload.data || {};
      
      // Use OpenAI search to analyze sector
      const searchQuery = `Analyze the ${sector} sector. Include performance metrics, key trends, major players, and market outlook.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a sector analyst. Search for and analyze sector performance, trends, and investment opportunities."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const analysis = this.parseSectorAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'sector_analysis_complete',
          data: {
            sector,
            analysis,
            topStocks: analysis.topStocks,
            outlook: analysis.outlook,
            risks: analysis.risks
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

  private async getTrendingTopics(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { limit = 10 } = message.payload.data || {};
      
      // Use OpenAI search to get trending topics
      const searchQuery = `Search for trending financial topics and market news today. Identify the most important market-moving stories.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a financial news curator. Search for and identify trending financial topics and market-moving news."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1000,
      });

      const trendingTopics = this.parseTrendingTopics(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'trending_topics_complete',
          data: {
            topics: trendingTopics.slice(0, limit),
            timestamp: new Date().toISOString()
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

  private async analyzeEventImpact(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { event, affectedSymbols } = message.payload.data || {};
      
      // Use OpenAI search to analyze event impact
      const searchQuery = `Analyze the market impact of: ${event}. Include effects on affected securities and overall market implications.`;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a market impact analyst. Search for and analyze how specific events affect financial markets and individual securities."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 1500,
      });

      const impactAnalysis = this.parseEventImpactAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'event_impact_complete',
          data: {
            event,
            analysis: impactAnalysis,
            affectedSymbols,
            marketImpact: impactAnalysis.marketImpact,
            timeframe: impactAnalysis.timeframe
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

  private buildSearchQuery(symbols?: string[], keywords?: string[], timeframe?: string): string {
    let query = 'Find the most recent financial news and market analysis';
    
    if (symbols && symbols.length > 0) {
      query += ` about ${symbols.join(', ')} stock prices and market performance`;
    }
    
    if (keywords && keywords.length > 0) {
      query += ` related to ${keywords.join(', ')}`;
    }
    
    if (timeframe) {
      query += ` from the ${timeframe}`;
    } else {
      query += ' from today';
    }
    
    query += '. Include current market sentiment, price movements, trading volume, and analyst opinions.';
    
    return query;
  }

  private parseNewsAnalysis(content: string): any {
    // Parse OpenAI response into structured analysis
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      sentiment: this.extractSentiment(content),
      marketImpact: this.extractSection(content, 'market impact') || 'Moderate',
      keyPoints: this.extractKeyPoints(content)
    };
  }

  private parseCompanyAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      recommendation: this.extractRecommendation(content),
      confidence: this.extractConfidence(content),
      keyMetrics: this.extractKeyPoints(content)
    };
  }

  private parseSentimentAnalysis(content: string): any {
    return {
      sentiment: this.extractSentiment(content),
      confidence: this.extractConfidence(content),
      keyFactors: this.extractKeyPoints(content),
      trend: this.extractTrend(content)
    };
  }

  private parseSectorAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      topStocks: this.extractTopStocks(content),
      outlook: this.extractOutlook(content),
      risks: this.extractRisks(content)
    };
  }

  private parseTrendingTopics(content: string): string[] {
    // Extract trending topics from OpenAI response
    const topics: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^\*/)) {
        const topic = line.replace(/^\d+\.|^-|^\*/, '').trim();
        if (topic) {
          topics.push(topic);
        }
      }
    }
    
    return topics.length > 0 ? topics : ['Market volatility', 'Earnings reports', 'Economic indicators'];
  }

  private parseEventImpactAnalysis(content: string): any {
    return {
      summary: this.extractSection(content, 'summary') || content.substring(0, 300),
      marketImpact: this.extractSection(content, 'market impact') || 'Moderate',
      timeframe: this.extractTimeframe(content),
      affectedSectors: this.extractAffectedSectors(content)
    };
  }

  // Helper methods for parsing OpenAI responses
  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractSentiment(content: string): Sentiment {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('positive') || lowerContent.includes('bullish')) {
      return Sentiment.POSITIVE;
    } else if (lowerContent.includes('negative') || lowerContent.includes('bearish')) {
      return Sentiment.NEGATIVE;
    }
    return Sentiment.NEUTRAL;
  }

  private extractRecommendation(content: string): Recommendation {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('buy') || lowerContent.includes('strong buy')) {
      return Recommendation.BUY;
    } else if (lowerContent.includes('sell') || lowerContent.includes('strong sell')) {
      return Recommendation.SELL;
    }
    return Recommendation.HOLD;
  }

  private extractConfidence(content: string): number {
    const confidenceMatch = content.match(/confidence:?\s*(\d+)/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.75;
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

  private extractTrend(content: string): string {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('upward') || lowerContent.includes('rising')) {
      return 'Upward';
    } else if (lowerContent.includes('downward') || lowerContent.includes('falling')) {
      return 'Downward';
    }
    return 'Neutral';
  }

  private extractTopStocks(content: string): string[] {
    // Extract mentioned stock symbols or company names
    const stockPattern = /\b[A-Z]{1,5}\b/g;
    const matches = content.match(stockPattern) || [];
    return matches.slice(0, 5);
  }

  private extractOutlook(content: string): string {
    return this.extractSection(content, 'outlook') || 'Stable';
  }

  private extractRisks(content: string): string[] {
    const risks = this.extractSection(content, 'risks');
    return risks ? risks.split(',').map(r => r.trim()) : ['Market volatility'];
  }

  private extractTimeframe(content: string): string {
    const timeframes = ['short-term', 'medium-term', 'long-term'];
    const lowerContent = content.toLowerCase();
    
    for (const timeframe of timeframes) {
      if (lowerContent.includes(timeframe)) {
        return timeframe;
      }
    }
    
    return 'short-term';
  }

  private extractAffectedSectors(content: string): string[] {
    const sectors = ['technology', 'healthcare', 'finance', 'energy', 'utilities'];
    const lowerContent = content.toLowerCase();
    const affectedSectors: string[] = [];
    
    for (const sector of sectors) {
      if (lowerContent.includes(sector)) {
        affectedSectors.push(sector);
      }
    }
    
    return affectedSectors.length > 0 ? affectedSectors : ['general market'];
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