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
import { costTracker, extractTokenUsage, logApiCallDetails } from '@/lib/cost-tracker';

export class MarketResearchAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;
  private model: string = 'gpt-4.1-2025-04-14'; // Default model

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

  /**
   * Set the AI model for this agent instance
   */
  setModel(model: string): void {
    this.model = model;
    console.log(`MarketResearchAgent model set to: ${model}`);
  }

  /**
   * Get the current AI model
   */
  getModel(): string {
    return this.model;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    
    handlers.set('analyze_news', this.analyzeNews.bind(this));
    handlers.set('research_company', this.researchCompany.bind(this));
    handlers.set('analyze_market_sentiment', this.analyze_market_sentiment.bind(this));
    handlers.set('analyze_sector', this.analyzeSector.bind(this));
    handlers.set('get_trending_topics', this.getTrendingTopics.bind(this));
    handlers.set('analyze_event_impact', this.analyzeEventImpact.bind(this));
    
    return handlers;
  }

  private async analyzeNews(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, keywords, timeframe } = message.payload.data || {};
      
      // Enhanced prompt for comprehensive news analysis
      const searchQuery = `As a senior financial analyst, provide a comprehensive news analysis for ${symbols?.join(', ') || 'major market indices'} covering the ${timeframe || 'last 24 hours'}. 

      Structure your analysis as follows:
      
      **EXECUTIVE SUMMARY:**
      - Brief overview of key market developments
      - Overall sentiment assessment
      - Primary market drivers identified
      
      **DETAILED ANALYSIS:**
      - Market News Impact: Analyze 5-7 most significant news stories
      - Price Movement Context: Connect news to specific price movements
      - Volume Analysis: Trading volume patterns and what they indicate
      - Sector Impact: How news affects different sectors
      - Institutional Activity: Signs of institutional buying/selling
      
      **SENTIMENT ANALYSIS:**
      - Overall market sentiment (Strong Bullish/Bullish/Neutral/Bearish/Strong Bearish)
      - Sentiment confidence level (1-10)
      - Key sentiment drivers
      - Social media sentiment vs traditional media
      
      **MARKET IMPACT ASSESSMENT:**
      - Immediate impact (next 1-3 days)
      - Medium-term implications (1-4 weeks)
      - Long-term considerations (1-6 months)
      - Risk factors to monitor
      
      **TRADING IMPLICATIONS:**
      - Key support/resistance levels
      - Volatility expectations
      - Options activity insights
      - Recommended position sizing
      
      **QUANTITATIVE METRICS:**
      - Volatility index changes
      - Put/call ratios
      - Market breadth indicators
      - Correlation analysis
      
      Include specific price targets, percentage moves, and timeframes where applicable.`;

      const startTime = Date.now();
      console.log('🚀 Market Research Agent - Making OpenAI API call:', {
        "model": this.model,
        action: 'analyze_news',
        maxTokens: 4096,
        temperature: 0.3,
        promptLength: searchQuery.length
      });
      
      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a senior financial analyst with 15+ years of experience in equity research and market analysis. Provide detailed, actionable insights with specific metrics and professional recommendations."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });
      const duration = Date.now() - startTime;
      
      console.log('✅ Market Research Agent - OpenAI API response received:', {
        duration,
        hasUsage: !!response.usage,
        responseLength: response.choices[0]?.message?.content?.length || 0
      });
      
      // Track costs
      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        this.identity.id,
        this.identity.name,
        this.generateId(),
        'analyze_news',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Market Research Agent - analyze_news: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedNewsAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'news_analysis_complete',
          data: {
            symbols: symbols || ['SPY', 'QQQ', 'IWM'],
            executiveSummary: analysis.executiveSummary,
            detailedAnalysis: analysis.detailedAnalysis,
            sentimentAnalysis: analysis.sentimentAnalysis,
            marketImpact: analysis.marketImpact,
            tradingImplications: analysis.tradingImplications,
            quantitativeMetrics: analysis.quantitativeMetrics,
            keyRisks: analysis.keyRisks,
            recommendations: analysis.recommendations,
            confidenceLevel: analysis.confidenceLevel,
            timestamp: new Date().toISOString(),
            costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_news_analysis',
          dataQuality: 'high'
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async researchCompany(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbol, aspects } = message.payload.data || {};
      
      // Enhanced prompt for comprehensive company research
      const searchQuery = `Conduct comprehensive equity research analysis for ${symbol}. Provide institutional-quality research report with the following structure:

      **COMPANY OVERVIEW:**
      - Business model and competitive positioning
      - Market capitalization and trading metrics
      - Key financial metrics (P/E, P/B, ROE, ROA, etc.)
      - Dividend policy and yield analysis
      
      **FINANCIAL ANALYSIS:**
      - Revenue growth trends (3-5 year analysis)
      - Profitability metrics and margins
      - Balance sheet strength and debt analysis
      - Cash flow analysis and capital allocation
      - Working capital management
      
      **VALUATION ANALYSIS:**
      - Current valuation multiples vs peers
      - DCF-based fair value estimate
      - Price targets from major analysts
      - Relative valuation assessment
      - Sum-of-parts analysis if applicable
      
      **BUSINESS FUNDAMENTALS:**
      - Core business drivers and KPIs
      - Market share and competitive position
      - Management quality and strategic execution
      - Industry dynamics and growth prospects
      
      **RISK ASSESSMENT:**
      - Company-specific risks
      - Industry and regulatory risks
      - ESG considerations
      - Scenario analysis (bull/base/bear cases)
      
      **TECHNICAL ANALYSIS:**
      - Chart pattern analysis
      - Key support/resistance levels
      - Volume and momentum indicators
      - Institutional ownership trends
      
      **INVESTMENT RECOMMENDATION:**
      - Investment thesis (buy/hold/sell)
      - Target price and timeframe
      - Risk/reward assessment
      - Portfolio allocation guidance
      
      Provide specific numbers, percentages, and timeframes for all recommendations.`;

      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a senior equity research analyst at a top-tier investment bank. Provide detailed, institutional-quality research reports with specific metrics, price targets, and professional recommendations."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.2,
      });
      const duration = Date.now() - startTime;
      
      // Track costs
      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        this.identity.id,
        this.identity.name,
        this.generateId(),
        'research_company',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Market Research Agent - research_company: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedCompanyAnalysis(response.choices[0].message.content || '');
      
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
            companyOverview: analysis.companyOverview,
            financialAnalysis: analysis.financialAnalysis,
            valuationAnalysis: analysis.valuationAnalysis,
            businessFundamentals: analysis.businessFundamentals,
            riskAssessment: analysis.riskAssessment,
            technicalAnalysis: analysis.technicalAnalysis,
            investmentRecommendation: analysis.investmentRecommendation,
            priceTarget: analysis.priceTarget,
            timeframe: analysis.timeframe,
            confidenceLevel: analysis.confidenceLevel,
            lastUpdated: new Date().toISOString(),
            costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_company_research',
          dataQuality: 'institutional_grade'
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  // This is the main method called by the workflow
  async analyze_market_sentiment(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe } = message.payload.data || {};
      
      // Build comprehensive search query
      const searchQuery = `
Analyze current market sentiment for ${symbols?.join(', ') || 'major market indices'} over ${timeframe || 'the past week'}. 

Please provide a structured analysis with the following format:

**MARKET SENTIMENT OVERVIEW:**
- Overall sentiment: [bullish/bearish/neutral]
- Sentiment strength: [1-10 scale]
- Key drivers: [list specific catalysts]
- Market behavior: [describe participant patterns]

**TECHNICAL INDICATORS:**
- Price action: [specific signals]
- Volume patterns: [trading volume analysis]
- Support/Resistance: [key levels]
- Momentum: [RSI, MACD, etc.]

**FUNDAMENTAL FACTORS:**
- Economic data: [specific indicators]
- Earnings sentiment: [corporate performance]
- Sector rotation: [which sectors moving]
- Policy impact: [Fed, fiscal policy, etc.]

**RISK ASSESSMENT:**
- Contrarian signals: [extreme readings]
- Volatility outlook: [VIX analysis]
- Potential reversals: [warning signs]
- Risk factors: [specific concerns]

**RECOMMENDATIONS:**
- Trading strategy: [specific actions]
- Risk management: [stop losses, position sizing]
- Timeframe: [short/medium/long term]
- Key levels to watch: [specific prices]

Provide specific numbers, percentages, and actionable insights. Use exact metrics and avoid generic statements.
      `;

      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a senior market sentiment analyst with 15+ years of experience in behavioral finance and market psychology. Provide detailed, actionable sentiment analysis with specific metrics and professional recommendations."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });
      const duration = Date.now() - startTime;
      
      // Log detailed API call information
      logApiCallDetails(
        this.identity.name,
        'analyze_market_sentiment',
        'gpt-4',
        searchQuery,
        response,
        duration
      );
      
      // Track costs
      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        this.identity.id,
        this.identity.name,
        this.generateId(),
        'analyze_market_sentiment',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Market Research Agent - analyze_market_sentiment: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedSentimentAnalysis(response.choices[0].message.content || '');
      
      // Embed cost information in response
      const responseWithCost = {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'market_sentiment_complete',
          data: {
            analysis,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            keyPoints: analysis.keyPoints,
            recommendations: analysis.recommendations,
            costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };

      return responseWithCost;
    } catch (error) {
      console.error('Market Research Agent - analyze_market_sentiment error:', error);
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async analyzeSector(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { sector, metrics } = message.payload.data || {};
      
      // Enhanced prompt for comprehensive sector analysis
      const searchQuery = `Provide comprehensive sector analysis for the ${sector || 'Technology'} sector. 

      **SECTOR OVERVIEW:**
      - Current sector performance vs S&P 500
      - Key sector ETF performance (XLK, XLF, XLE, etc.)
      - Market cap distribution and concentration
      - Sector rotation dynamics
      
      **PERFORMANCE ANALYSIS:**
      - YTD, 1M, 3M, 1Y performance metrics
      - Volatility and risk-adjusted returns
      - Relative strength vs market
      - Sector momentum indicators
      
      **FUNDAMENTAL ANALYSIS:**
      - Aggregate P/E, P/B, PEG ratios
      - Revenue and earnings growth trends
      - Profit margins and ROE analysis
      - Balance sheet strength metrics
      
      **TOP HOLDINGS ANALYSIS:**
      - Top 10 sector holdings by weight
      - Individual stock performance within sector
      - Relative valuation analysis
      - Earnings revision trends
      
      **INDUSTRY DYNAMICS:**
      - Key industry trends and catalysts
      - Competitive landscape changes
      - Regulatory environment impact
      - Technology disruption factors
      
      **MACROECONOMIC FACTORS:**
      - Interest rate sensitivity
      - Economic cycle positioning
      - Currency exposure impact
      - Commodity price relationships
      
      **INVESTMENT OUTLOOK:**
      - Sector allocation recommendations
      - Risk/reward assessment
      - Key catalysts and risks ahead
      - Preferred sub-sectors and stocks
      
      **TECHNICAL ANALYSIS:**
      - Sector ETF chart patterns
      - Support/resistance levels
      - Volume and momentum trends
      - Relative strength indicators
      
      Provide specific metrics, percentages, and investment recommendations.`;

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a senior sector analyst with expertise in industry analysis and sector rotation strategies. Provide detailed, actionable sector insights with specific metrics and investment recommendations."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });

      const analysis = this.parseEnhancedSectorAnalysis(response.choices[0].message.content || '');
      
      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'sector_analysis_complete',
          data: {
            sector: sector || 'Technology',
            sectorOverview: analysis.sectorOverview,
            performanceAnalysis: analysis.performanceAnalysis,
            fundamentalAnalysis: analysis.fundamentalAnalysis,
            topHoldings: analysis.topHoldings,
            industryDynamics: analysis.industryDynamics,
            macroeconomicFactors: analysis.macroeconomicFactors,
            investmentOutlook: analysis.investmentOutlook,
            technicalAnalysis: analysis.technicalAnalysis,
            keyRisks: analysis.keyRisks,
            recommendations: analysis.recommendations,
            confidenceLevel: analysis.confidenceLevel,
            timestamp: new Date().toISOString()
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_sector_analysis',
          dataQuality: 'institutional_grade'
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
        "model": this.model,
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
        "model": this.model,
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

  // Enhanced parsing functions with structured data extraction
  private parseEnhancedNewsAnalysis(content: string): any {
    // Extract sentiment from the structured response
    const sentimentSection = this.extractStructuredSection(content, 'MARKET SENTIMENT OVERVIEW');
    const overallSentiment = this.extractSentimentAdvanced(content);
    const sentimentStrength = this.extractNumericValue(content, 'sentiment strength', 5);
    
    // Extract technical indicators
    const technicalSection = this.extractStructuredSection(content, 'TECHNICAL INDICATORS');
    const supportResistance = this.extractStructuredSection(content, 'Support/Resistance') || 
                             this.extractStructuredSection(content, 'support/resistance');
    
    // Extract fundamental factors
    const fundamentalSection = this.extractStructuredSection(content, 'FUNDAMENTAL FACTORS');
    
    // Extract risk assessment
    const riskSection = this.extractStructuredSection(content, 'RISK ASSESSMENT');
    const volatilityOutlook = this.extractStructuredSection(content, 'Volatility outlook') || 
                             this.extractStructuredSection(content, 'VIX analysis');
    
    // Extract recommendations
    const recommendationsSection = this.extractStructuredSection(content, 'RECOMMENDATIONS');
    const tradingStrategy = this.extractStructuredSection(content, 'Trading strategy') || 
                           this.extractStructuredSection(content, 'trading strategy');
    
    return {
      sentiment: overallSentiment,
      confidence: sentimentStrength,
      analysis: {
        sentiment: overallSentiment,
        confidence: sentimentStrength,
        trends: this.extractBulletPoints(content, 'Key drivers'),
        news_summary: fundamentalSection || 'Market fundamentals analyzed'
      },
      technicalAnalysis: {
        supportResistance: supportResistance || 'Key levels identified',
        volumeAnalysis: this.extractStructuredSection(content, 'Volume patterns') || 'Volume analysis provided',
        momentum: this.extractStructuredSection(content, 'Momentum') || 'Momentum indicators analyzed'
      },
      riskAssessment: {
        volatility: volatilityOutlook || 'Volatility analysis provided',
        contrarianSignals: this.extractBulletPoints(content, 'Contrarian signals'),
        riskFactors: this.extractBulletPoints(content, 'Risk factors')
      },
      recommendations: {
        strategy: tradingStrategy || 'Trading strategy provided',
        riskManagement: this.extractStructuredSection(content, 'Risk management') || 'Risk management guidance',
        timeframe: this.extractTimeframeAdvanced(content)
      }
    };
  }

  private parseEnhancedCompanyAnalysis(content: string): any {
    return {
      companyOverview: {
        businessModel: this.extractStructuredSection(content, 'business model') || 'Business model analysis',
        marketCap: this.extractStructuredSection(content, 'market cap') || 'Market capitalization data',
        keyMetrics: this.extractStructuredSection(content, 'key financial metrics') || 'Financial metrics summary',
        dividendPolicy: this.extractStructuredSection(content, 'dividend') || 'Dividend analysis'
      },
      financialAnalysis: {
        revenueGrowth: this.extractStructuredSection(content, 'revenue growth') || 'Revenue growth analysis',
        profitability: this.extractStructuredSection(content, 'profitability') || 'Profitability metrics',
        balanceSheet: this.extractStructuredSection(content, 'balance sheet') || 'Balance sheet strength',
        cashFlow: this.extractStructuredSection(content, 'cash flow') || 'Cash flow analysis'
      },
      valuationAnalysis: {
        currentMultiples: this.extractStructuredSection(content, 'valuation multiples') || 'Valuation multiples',
        dcfValue: this.extractStructuredSection(content, 'DCF') || 'DCF valuation',
        priceTargets: this.extractStructuredSection(content, 'price targets') || 'Analyst price targets',
        relativeValuation: this.extractStructuredSection(content, 'relative valuation') || 'Peer comparison'
      },
      businessFundamentals: {
        businessDrivers: this.extractBulletPoints(content, 'business drivers'),
        competitivePosition: this.extractStructuredSection(content, 'competitive position') || 'Competitive analysis',
        managementQuality: this.extractStructuredSection(content, 'management') || 'Management assessment',
        industryDynamics: this.extractStructuredSection(content, 'industry dynamics') || 'Industry analysis'
      },
      riskAssessment: {
        companyRisks: this.extractBulletPoints(content, 'company-specific risks'),
        industryRisks: this.extractBulletPoints(content, 'industry risks'),
        esgFactors: this.extractStructuredSection(content, 'ESG') || 'ESG considerations',
        scenarioAnalysis: this.extractStructuredSection(content, 'scenario analysis') || 'Scenario outcomes'
      },
      technicalAnalysis: {
        chartPatterns: this.extractStructuredSection(content, 'chart pattern') || 'Technical patterns',
        keyLevels: this.extractStructuredSection(content, 'support/resistance') || 'Key price levels',
        momentum: this.extractStructuredSection(content, 'momentum') || 'Momentum indicators',
        ownership: this.extractStructuredSection(content, 'institutional ownership') || 'Ownership analysis'
      },
      investmentRecommendation: {
        recommendation: this.extractRecommendationAdvanced(content),
        investmentThesis: this.extractStructuredSection(content, 'investment thesis') || 'Investment rationale',
        riskReward: this.extractStructuredSection(content, 'risk/reward') || 'Risk/reward assessment',
        allocation: this.extractStructuredSection(content, 'portfolio allocation') || 'Allocation guidance'
      },
      priceTarget: this.extractNumericValue(content, 'target price', 100),
      timeframe: this.extractTimeframeAdvanced(content),
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedSentimentAnalysis(content: string): any {
    // Extract the actual sentiment (bullish/bearish/neutral)
    const extractedSentiment = this.extractSentiment(content);
    
    // Convert enum to financial terminology
    let sentimentString = 'Neutral';
    if (extractedSentiment === Sentiment.POSITIVE) {
      sentimentString = 'Bullish';
    } else if (extractedSentiment === Sentiment.NEGATIVE) {
      sentimentString = 'Bearish';
    } else if (extractedSentiment === Sentiment.NEUTRAL) {
      sentimentString = 'Neutral';
    }
    
    return {
      sentiment: sentimentString, // Add this for the main sentiment field
      confidence: this.extractNumericValue(content, 'sentiment strength', 7.5),
      sentimentOverview: {
        overallScore: this.extractNumericValue(content, 'sentiment score', 5.0),
        primaryDrivers: this.extractBulletPoints(content, 'sentiment drivers'),
        momentum: this.extractStructuredSection(content, 'sentiment momentum') || 'Momentum analysis',
        inflectionPoints: this.extractBulletPoints(content, 'inflection points')
      },
      multiSourceAnalysis: {
        traditionalMedia: this.extractStructuredSection(content, 'traditional media') || 'Traditional media sentiment',
        socialMedia: this.extractStructuredSection(content, 'social media') || 'Social media sentiment',
        analystSentiment: this.extractStructuredSection(content, 'analyst sentiment') || 'Analyst sentiment',
        institutionalSentiment: this.extractStructuredSection(content, 'institutional sentiment') || 'Institutional sentiment',
        retailSentiment: this.extractStructuredSection(content, 'retail investor') || 'Retail sentiment'
      },
      quantitativeMetrics: {
        vixLevel: this.extractNumericValue(content, 'VIX', 20),
        putCallRatio: this.extractNumericValue(content, 'put/call', 1.0),
        insiderTrading: this.extractStructuredSection(content, 'insider trading') || 'Insider activity',
        institutionalFlows: this.extractStructuredSection(content, 'institutional flows') || 'Flow analysis',
        optionsPositioning: this.extractStructuredSection(content, 'options positioning') || 'Options activity'
      },
      sentimentByTimeframe: {
        intraday: this.extractStructuredSection(content, 'intraday sentiment') || 'Intraday shifts',
        weekly: this.extractStructuredSection(content, 'weekly sentiment') || 'Weekly trends',
        monthly: this.extractStructuredSection(content, 'monthly sentiment') || 'Monthly patterns',
        seasonal: this.extractStructuredSection(content, 'seasonal') || 'Seasonal factors'
      },
      contrarianIndicators: {
        extremeReadings: this.extractBulletPoints(content, 'extreme sentiment'),
        divergences: this.extractBulletPoints(content, 'divergences'),
        crowdBehavior: this.extractStructuredSection(content, 'crowd behavior') || 'Crowd analysis',
        fearGreed: this.extractStructuredSection(content, 'fear/greed') || 'Fear/greed indicators'
      },
              analyticalInsights: {
          priceAnalysis: this.extractStructuredSection(content, 'price analysis') || 'Price assessment',
        reversalProbability: this.extractNumericValue(content, 'reversal probability', 30),
        catalystsAhead: this.extractBulletPoints(content, 'catalysts ahead'),
        riskReward: this.extractStructuredSection(content, 'risk/reward') || 'Risk/reward based on sentiment'
      },
      overallScore: this.extractNumericValue(content, 'overall sentiment', 5.0),
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedSectorAnalysis(content: string): any {
    return {
      sectorOverview: {
        relativePerformance: this.extractStructuredSection(content, 'sector performance') || 'Performance vs market',
        etfPerformance: this.extractStructuredSection(content, 'ETF performance') || 'Sector ETF analysis',
        marketCapDistribution: this.extractStructuredSection(content, 'market cap') || 'Market cap analysis',
        rotationDynamics: this.extractStructuredSection(content, 'rotation') || 'Sector rotation analysis'
      },
      performanceAnalysis: {
        performanceMetrics: this.extractStructuredSection(content, 'YTD') || 'Performance metrics',
        volatility: this.extractStructuredSection(content, 'volatility') || 'Volatility analysis',
        relativeStrength: this.extractStructuredSection(content, 'relative strength') || 'Strength vs market',
        momentum: this.extractStructuredSection(content, 'momentum') || 'Momentum indicators'
      },
      fundamentalAnalysis: {
        valuationMetrics: this.extractStructuredSection(content, 'P/E') || 'Valuation metrics',
        growthTrends: this.extractStructuredSection(content, 'growth trends') || 'Growth analysis',
        profitability: this.extractStructuredSection(content, 'profit margins') || 'Profitability metrics',
        balanceSheetStrength: this.extractStructuredSection(content, 'balance sheet') || 'Balance sheet analysis'
      },
      topHoldings: {
        topStocks: this.extractTopStocksAdvanced(content),
        performanceAnalysis: this.extractStructuredSection(content, 'individual stock') || 'Stock performance',
        valuationAnalysis: this.extractStructuredSection(content, 'relative valuation') || 'Valuation comparison',
        earningsRevisions: this.extractStructuredSection(content, 'earnings revision') || 'Earnings trends'
      },
      industryDynamics: {
        keyTrends: this.extractBulletPoints(content, 'industry trends'),
        competitiveLandscape: this.extractStructuredSection(content, 'competitive landscape') || 'Competition analysis',
        regulatoryEnvironment: this.extractStructuredSection(content, 'regulatory') || 'Regulatory impact',
        technologyDisruption: this.extractStructuredSection(content, 'technology disruption') || 'Tech disruption'
      },
      macroeconomicFactors: {
        interestRateSensitivity: this.extractStructuredSection(content, 'interest rate') || 'Rate sensitivity',
        economicCycle: this.extractStructuredSection(content, 'economic cycle') || 'Cycle positioning',
        currencyExposure: this.extractStructuredSection(content, 'currency') || 'Currency impact',
        commodityRelationships: this.extractStructuredSection(content, 'commodity') || 'Commodity relationships'
      },
      investmentOutlook: {
        allocationRecommendations: this.extractStructuredSection(content, 'allocation') || 'Allocation guidance',
        riskReward: this.extractStructuredSection(content, 'risk/reward') || 'Risk/reward assessment',
        catalystsAndRisks: this.extractBulletPoints(content, 'catalysts'),
        preferredSubsectors: this.extractBulletPoints(content, 'preferred')
      },
      technicalAnalysis: {
        chartPatterns: this.extractStructuredSection(content, 'chart patterns') || 'Technical patterns',
        supportResistance: this.extractStructuredSection(content, 'support/resistance') || 'Key levels',
        volumeTrends: this.extractStructuredSection(content, 'volume') || 'Volume analysis',
        relativeStrengthIndicators: this.extractStructuredSection(content, 'relative strength') || 'RS indicators'
      },
      keyRisks: this.extractBulletPoints(content, 'risks'),
      recommendations: this.extractBulletPoints(content, 'recommendations'),
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
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
      return Recommendation.POSITIVE;
    } else if (lowerContent.includes('negative') || lowerContent.includes('bearish')) {
      return Recommendation.NEGATIVE;
    }
          return Recommendation.NEUTRAL;
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

  // Enhanced helper methods for better data extraction
  private extractStructuredSection(content: string, sectionName: string): string | null {
    const patterns = [
      new RegExp(`\\*\\*${sectionName}:?\\*\\*([^*]+)`, 'i'),
      new RegExp(`${sectionName}:?\\s*([^\\n]+(?:\\n(?!\\*\\*|\\d+\\.|-).*)*?)`, 'i'),
      new RegExp(`${sectionName}:?\\s*([^\\n]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractBulletPoints(content: string, context: string): string[] {
    const contextSection = this.extractStructuredSection(content, context);
    if (!contextSection) {
      return this.extractKeyPoints(content);
    }
    
    const points: string[] = [];
    const lines = contextSection.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\s*[-*•]\s*/) || line.match(/^\s*\d+\.\s*/)) {
        const point = line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+\.\s*/, '').trim();
        if (point && point.length > 5) {
          points.push(point);
        }
      }
    }
    
    return points.length > 0 ? points : ['Analysis provided'];
  }

  private extractNumericValue(content: string, metric: string, defaultValue: number): number {
    const patterns = [
      new RegExp(`${metric}:?\\s*([0-9.]+)`, 'i'),
      new RegExp(`${metric}.*?([0-9.]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    
    return defaultValue;
  }

  private extractSentimentAdvanced(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('strong bull') || lowerContent.includes('very positive')) {
      return 'Strong Bullish';
    } else if (lowerContent.includes('bullish') || lowerContent.includes('positive')) {
      return 'Bullish';
    } else if (lowerContent.includes('strong bear') || lowerContent.includes('very negative')) {
      return 'Strong Bearish';
    } else if (lowerContent.includes('bearish') || lowerContent.includes('negative')) {
      return 'Bearish';
    }
    
    return 'Neutral';
  }

  private extractRecommendationAdvanced(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('strong buy') || lowerContent.includes('buy rating')) {
      return 'Strong Buy';
    } else if (lowerContent.includes('buy') || lowerContent.includes('overweight')) {
      return 'Buy';
    } else if (lowerContent.includes('strong sell') || lowerContent.includes('sell rating')) {
      return 'Strong Sell';
    } else if (lowerContent.includes('sell') || lowerContent.includes('underweight')) {
      return 'Sell';
    }
    
    return 'Hold';
  }

  private extractTimeframeAdvanced(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('12 months') || lowerContent.includes('1 year')) {
      return '12 months';
    } else if (lowerContent.includes('6 months')) {
      return '6 months';
    } else if (lowerContent.includes('3 months')) {
      return '3 months';
    } else if (lowerContent.includes('short-term')) {
      return 'Short-term (1-3 months)';
    } else if (lowerContent.includes('medium-term')) {
      return 'Medium-term (3-12 months)';
    } else if (lowerContent.includes('long-term')) {
      return 'Long-term (12+ months)';
    }
    
    return '6-12 months';
  }

  private extractTopStocksAdvanced(content: string): Array<{symbol: string, weight: number, performance: string}> {
    const stocks: Array<{symbol: string, weight: number, performance: string}> = [];
    
    // Extract stock symbols with better pattern matching
    const stockPattern = /\b([A-Z]{1,5})\b/g;
    const matches = content.match(stockPattern) || [];
    
    // Filter out common false positives
    const filteredMatches = matches.filter(match => 
      !['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THIS', 'THAT', 'WILL', 'HAVE', 'MORE', 'BEEN', 'THAN', 'THEY', 'WERE', 'WHAT', 'YOUR', 'THEIR', 'SAID', 'EACH', 'WHICH', 'AFTER', 'FIRST', 'WELL', 'YEAR', 'WORK', 'SUCH', 'MAKE', 'EVEN', 'MOST', 'TAKE', 'OVER', 'THINK', 'ALSO', 'BACK', 'AFTER', 'LIFE', 'WORLD', 'STILL', 'SHOULD', 'AGAIN', 'MADE', 'EVERY', 'NEVER', 'BEING', 'THESE', 'BOTH', 'CAME', 'GOOD', 'CALL', 'MUST', 'LONG', 'WANT', 'DOES', 'LAST', 'BEST', 'ONCE', 'LIKE', 'MANY', 'JUST', 'KNOW', 'ONLY', 'SOME', 'VERY', 'MUCH', 'WHEN', 'HELP', 'NEED', 'SURE', 'REAL', 'SEEM', 'FEEL', 'LOOK', 'RATE', 'RISK', 'YEAR', 'WEEK', 'FAIR', 'GOOD', 'HIGH', 'FULL', 'NEXT', 'KEEP', 'MOVE', 'PRICE', 'STOCK', 'MARKET', 'TRADE', 'SELL', 'HOLD', 'STRONG', 'WEAK', 'CLOSE', 'OPEN', 'CHART', 'TREND', 'BULL', 'BEAR', 'CALL', 'PUTS', 'FUND', 'BONDS', 'CASH', 'GOLD', 'NEAR', 'TERM', 'TERM', 'BULL', 'BEAR', 'TECH', 'EARN', 'EARN', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR', 'BULL', 'BEAR'].includes(match)
    );
    
    // Take first 10 potential stocks
    const topMatches = [...new Set(filteredMatches)].slice(0, 10);
    
    topMatches.forEach((symbol, index) => {
      stocks.push({
        symbol,
        weight: 10 - index, // Decreasing weight based on position
        performance: index < 5 ? 'Outperforming' : 'Mixed'
      });
    });
    
    return stocks.length > 0 ? stocks : [
      { symbol: 'AAPL', weight: 10, performance: 'Outperforming' },
      { symbol: 'MSFT', weight: 9, performance: 'Outperforming' },
      { symbol: 'GOOGL', weight: 8, performance: 'Mixed' }
    ];
  }
} 