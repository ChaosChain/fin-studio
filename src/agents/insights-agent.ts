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
import { costTracker, extractTokenUsage, logApiCallDetails } from '@/lib/cost-tracker';

export class InsightsAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;
  private model: string = 'gpt-4.1-2025-04-14'; // Default model

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

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();

    handlers.set('generate_daily_insights', this.generateDailyInsights.bind(this));
    handlers.set('generate_daily_insight', this.generateDailyInsights.bind(this)); // Alias for compatibility
    handlers.set('generate_insights', this.generateInsights.bind(this)); // Main insights handler
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
      const startTime = Date.now();
      console.log('🚀 Insights Agent - Making OpenAI API call:', {
        "model": this.model,
        action: 'generate_daily_insights',
        maxTokens: 4096,
        temperature: 0.7,
        promptLength: searchQuery.length
      });

      const response = await this.openai.chat.completions.create({
        "model": this.model,
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
      const duration = Date.now() - startTime;

      console.log('✅ Insights Agent - OpenAI API response received:', {
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
        'generate_daily_insights',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Insights Agent - generate_daily_insights: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

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
            riskFactors: insights.risks,
            costInfo: requestCost
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

  // This is the main method called by the workflow
  async generate_daily_insight(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { focus, timeframe, analysisData } = message.payload.data || {};

      // Get today's date in the format needed for the report
      const today = new Date();
      const dateString = today.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // Use OpenAI to generate comprehensive daily insights
      const searchQuery = `
Generate daily market insights for ${focus || 'global markets'} covering ${timeframe || 'today'} (${dateString}).

Please provide structured analysis with the following format:

**MARKET OVERVIEW:**
- Key Market Movements: [specific index changes and percentages]
- Major Index Performance: [S&P 500, NASDAQ, Dow Jones specific numbers]
- Sector Rotation: [which sectors moving up/down with percentages]
- Market Sentiment: [bullish/bearish/neutral with reasoning]

**ECONOMIC DEVELOPMENTS:**
- Economic Data Releases: [specific data points and their impact]
- Central Bank Signals: [specific policy announcements or hints]
- Geopolitical Events: [specific events and market impact]
- Currency Movements: [specific currency pairs and movements]

**SECTOR ANALYSIS:**
- Best Performing Sectors: [specific sectors with percentages]
- Worst Performing Sectors: [specific sectors with percentages]
- Individual Stock Highlights: [specific stocks and their performance]
- Earnings Developments: [specific earnings announcements]

**TECHNICAL INSIGHTS:**
- Key Technical Levels: [specific support/resistance levels]
- Chart Patterns: [specific patterns identified]
- Technical Signals: [specific buy/sell signals]
- Trend Analysis: [specific trend directions]

**INVESTMENT IMPLICATIONS:**
- Key Investment Themes: [specific themes to focus on]
- Risk Factors: [specific risks to watch]
- Positioning Recommendations: [specific actions to take]
- Near-term Outlook: [specific predictions for next few days]

Provide exact numbers, specific percentages, and actionable insights. Avoid generic statements. Use the current date ${dateString} in your analysis.
      `;

      const startTime = Date.now();

      const response = await this.openai.chat.completions.create({
        "model": this.model,
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
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      // Log detailed API call information
      logApiCallDetails(
        this.identity.name,
        'generate_daily_insight',
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
        'generate_daily_insight',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Insights Agent - generate_daily_insight: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const insights = this.parseInsights(response.choices[0].message.content || '');

      // Embed cost information in response
      const responseWithCost = {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'daily_insight_complete',
          data: {
            focus: focus || 'global markets',
            timeframe: timeframe || 'today',
            insights,
            keyHighlights: insights.keyHighlights,
            marketOutlook: insights.marketOutlook,
            recommendations: insights.recommendations,
            riskFactors: insights.riskFactors,
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
      console.error('Insights Agent - generate_daily_insight error:', error);
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async createMarketSummary(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { markets, timeframe } = message.payload.data || {};

      // Use OpenAI to create market summary
      const searchQuery = `Create a comprehensive market summary for ${markets?.join(', ') || 'major global markets'} covering ${timeframe || 'today'}. Include index performance, sector rotation, volume analysis, and key market drivers.`;
      const response = await this.openai.chat.completions.create({
        "model": this.model,
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
        "model": this.model,
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
        "model": this.model,
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
        "model": this.model,
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
        "model": this.model,
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
        "model": this.model,
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
    // Extract market overview
    const marketOverview = this.extractStructuredSection(content, 'MARKET OVERVIEW');
    const keyMovements = this.extractStructuredSection(content, 'Key Market Movements');
    const indexPerformance = this.extractStructuredSection(content, 'Major Index Performance');
    const sectorRotation = this.extractStructuredSection(content, 'Sector Rotation');
    const marketSentiment = this.extractStructuredSection(content, 'Market Sentiment');

    // Extract economic developments
    const economicDevelopments = this.extractStructuredSection(content, 'ECONOMIC DEVELOPMENTS');
    const dataReleases = this.extractStructuredSection(content, 'Economic Data Releases');
    const centralBankSignals = this.extractStructuredSection(content, 'Central Bank Signals');

    // Extract sector analysis
    const sectorAnalysis = this.extractStructuredSection(content, 'SECTOR ANALYSIS');
    const bestSectors = this.extractStructuredSection(content, 'Best Performing Sectors');
    const worstSectors = this.extractStructuredSection(content, 'Worst Performing Sectors');

    // Extract investment implications
    const investmentImplications = this.extractStructuredSection(content, 'INVESTMENT IMPLICATIONS');
    const keyThemes = this.extractBulletPoints(content, 'Key Investment Themes');
    const riskFactors = this.extractBulletPoints(content, 'Risk Factors');
    const recommendations = this.extractBulletPoints(content, 'Positioning Recommendations');

    return {
      insights: content.substring(0, 500), // First 500 characters as main insight
      keyPoints: keyThemes.length > 0 ? keyThemes : this.extractKeyPoints(content),
      marketOutlook: marketSentiment || 'Stable market outlook',
      recommendations: recommendations.length > 0 ? recommendations : ['Analysis provided by AI'],
      riskFactors: riskFactors.length > 0 ? riskFactors : ['Analysis provided']
    };
  }

  private parseMarketSummary(content: string): any {
    return {
      overview: this.extractStructuredSection(content, 'overview') || content.substring(0, 300),
      performance: this.extractStructuredSection(content, 'performance') || 'Market performance analysis',
      drivers: this.extractBulletPoints(content, 'drivers'),
      sectors: this.extractBulletPoints(content, 'sectors'),
      outlook: this.extractStructuredSection(content, 'outlook') || 'Market outlook assessment'
    };
  }

  private parseSynthesis(content: string): any {
    return {
      summary: this.extractStructuredSection(content, 'summary') || content.substring(0, 300),
      themes: this.extractBulletPoints(content, 'themes'),
      consensus: this.extractStructuredSection(content, 'consensus') || 'Market consensus analysis',
      conflicts: this.extractBulletPoints(content, 'conflicts'),
      recommendations: this.extractBulletPoints(content, 'recommendations')
    };
  }

  private parseReport(content: string): any {
    return {
      content: content,
      summary: this.extractStructuredSection(content, 'executive summary') || 'Executive summary',
      findings: this.extractBulletPoints(content, 'findings'),
      recommendations: this.extractBulletPoints(content, 'recommendations'),
      appendix: this.extractStructuredSection(content, 'appendix') || 'Supporting data'
    };
  }

  private parseAlert(content: string): any {
    return {
      config: this.extractStructuredSection(content, 'configuration') || 'Alert configuration',
      message: this.extractStructuredSection(content, 'message') || 'Alert message',
      recommendations: this.extractBulletPoints(content, 'recommendations')
    };
  }

  private parsePortfolioInsights(content: string): any {
    return {
      performance: this.extractStructuredSection(content, 'performance') || 'Portfolio performance analysis',
      risk: this.extractStructuredSection(content, 'risk') || 'Risk assessment',
      attribution: this.extractStructuredSection(content, 'attribution') || 'Performance attribution',
      recommendations: this.extractBulletPoints(content, 'recommendations'),
      rebalancing: this.extractStructuredSection(content, 'rebalancing') || 'Rebalancing recommendations'
    };
  }

  private parseAggregation(content: string): any {
    return {
      data: this.extractStructuredSection(content, 'data') || 'Aggregated data',
      patterns: this.extractBulletPoints(content, 'patterns'),
      trends: this.extractBulletPoints(content, 'trends'),
      insights: this.extractBulletPoints(content, 'insights'),
      confidence: this.extractNumericValue(content, 'confidence', 7.5)
    };
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

  private async generateInsights(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, analysisTypes } = message.payload.data || {};
      
      // Generate comprehensive insights by synthesizing all analysis types
      const searchQuery = `Generate comprehensive market insights for ${symbols?.join(', ') || 'market analysis'}. 
      Synthesize findings from ${analysisTypes?.join(', ') || 'sentiment, technical, and macro'} analysis. 
      Provide key insights, investment implications, risk assessment, and actionable recommendations.`;
      
      const startTime = Date.now();
      console.log('🚀 Insights Agent - Making OpenAI API call:', {
        "model": this.model,
        "action": 'generate_insights',
        "maxTokens": 4096,
        "temperature": 0.3,
        "promptLength": searchQuery.length
      });

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert financial analyst specializing in generating actionable market insights. 
            Your role is to synthesize complex financial data and provide clear, actionable recommendations.
            Focus on practical implications for investors and traders.`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 4096,
        temperature: 0.3
      });

      const duration = Date.now() - startTime;
      
      // Log detailed API call information
      logApiCallDetails(
        this.identity.name,
        'generate_insights',
        this.model,
        searchQuery,
        response,
        duration
      );

      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        'insights-agent',
        this.identity.name,
        this.generateId(),
        'generate_insights',
        this.model,
        usage,
        duration
      );

      const insights = response.choices[0]?.message?.content || '';

      // Parse the insights into structured format
      const structuredInsights = {
        summary: insights.substring(0, 500),
        keyInsights: this.extractKeyInsights(insights),
        recommendations: this.extractRecommendations(insights),
        riskFactors: this.extractRiskFactors(insights),
        marketOutlook: this.extractMarketOutlook(insights),
        confidence: this.calculateConfidenceScore(insights)
      };

      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'insights_generated',
          data: {
            insights: structuredInsights,
            symbols: symbols || [],
            analysisTypes: analysisTypes || [],
            costInfo: requestCost,
            generatedAt: new Date().toISOString()
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.createErrorResponse(message, error as Error);
    }
  }

  private extractKeyInsights(text: string): string[] {
    const insights: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('insight') || line.includes('key') || line.includes('important') || line.includes('•')) {
        const cleaned = line.replace(/[•\-*]/g, '').trim();
        if (cleaned.length > 10) {
          insights.push(cleaned);
        }
      }
    }
    
    return insights.slice(0, 5); // Top 5 insights
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('should') || line.includes('consider')) {
        const cleaned = line.replace(/[•\-*]/g, '').trim();
        if (cleaned.length > 10) {
          recommendations.push(cleaned);
        }
      }
    }
    
    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  private extractRiskFactors(text: string): string[] {
    const risks: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('risk') || line.includes('concern') || line.includes('caution') || line.includes('warning')) {
        const cleaned = line.replace(/[•\-*]/g, '').trim();
        if (cleaned.length > 10) {
          risks.push(cleaned);
        }
      }
    }
    
    return risks.slice(0, 3); // Top 3 risks
  }

  private extractMarketOutlook(text: string): string {
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('outlook') || line.includes('expect') || line.includes('forecast') || line.includes('future')) {
        return line.replace(/[•\-*]/g, '').trim();
      }
    }
    
    return 'Market outlook: Mixed signals with cautious optimism';
  }

  private calculateConfidenceScore(text: string): number {
    let score = 0.5; // Base confidence
    
    // Increase confidence based on content quality indicators
    if (text.length > 1000) score += 0.1;
    if (text.includes('data') || text.includes('analysis')) score += 0.1;
    if (text.includes('recommend') || text.includes('suggest')) score += 0.1;
    if (text.includes('risk') || text.includes('caution')) score += 0.1;
    
    return Math.min(1.0, score);
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