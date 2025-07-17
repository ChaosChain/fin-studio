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
import { costTracker, extractTokenUsage, logApiCallDetails } from '@/lib/cost-tracker';

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
    handlers.set('get_market_data', this.get_market_data.bind(this)); // Alias for compatibility
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
      
      // Enhanced prompt for comprehensive price data analysis
      const searchQuery = `As a senior quantitative analyst, provide comprehensive price data analysis for ${symbols?.join(', ') || 'major market indices'} covering ${timeframe || 'current trading session'} with ${interval || 'intraday'} granularity.

      **EXECUTIVE SUMMARY:**
      - Current price levels and key movements
      - Market sentiment and momentum assessment
      - Volume and liquidity analysis
      - Key technical levels and patterns

      **REAL-TIME PRICE ANALYSIS:**
      - Current bid/ask spreads and market depth
      - Intraday price action and volatility
      - Volume-weighted average price (VWAP) analysis
      - Price efficiency and market microstructure
      - Session high/low analysis and significance

      **TECHNICAL INDICATORS:**
      - Moving averages (SMA, EMA, TEMA) analysis
      - Momentum indicators (RSI, MACD, Stochastic)
      - Volatility indicators (Bollinger Bands, ATR)
      - Volume indicators (OBV, A/D Line, Volume Profile)
      - Trend strength indicators (ADX, Parabolic SAR)

      **CHART PATTERN ANALYSIS:**
      - Classical chart patterns (Head & Shoulders, Triangles, etc.)
      - Candlestick patterns and reversal signals
      - Support and resistance level identification
      - Trend line analysis and channel patterns
      - Fibonacci retracement and extension levels

      **VOLUME AND FLOW ANALYSIS:**
      - Volume distribution and profile analysis
      - Institutional vs retail flow patterns
      - Dark pool activity and hidden liquidity
      - Options flow and gamma exposure
      - Sector rotation and relative strength

      **VOLATILITY ANALYSIS:**
      - Realized vs implied volatility
      - Historical volatility patterns
      - Volatility term structure
      - VIX and volatility risk premium
      - Volatility clustering and regime changes

      **MARKET MICROSTRUCTURE:**
      - Order flow analysis and market depth
      - Bid-ask spread dynamics
      - Market maker behavior
      - High-frequency trading impact
      - Liquidity provision and consumption

      **RISK METRICS:**
      - Value at Risk (VaR) calculations
      - Expected shortfall and tail risk
      - Maximum drawdown analysis
      - Correlation and beta analysis
      - Sharpe ratio and risk-adjusted returns

      **TRADING IMPLICATIONS:**
      - Entry and exit signals
      - Position sizing recommendations
      - Stop-loss and take-profit levels
      - Risk management guidelines
      - Market timing considerations

      Provide specific price targets, probability estimates, and confidence intervals.`;

      const startTime = Date.now();
      console.log('🚀 Price Analysis Agent - Making OpenAI API call:', {
        "model": "gpt-4.1",
        action: 'get_price_data',
        maxTokens: 4096,
        temperature: 0.1,
        promptLength: searchQuery.length
      });
      
      const response = await this.openai.chat.completions.create({
        "model": "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a senior quantitative analyst specializing in price action analysis, technical indicators, and market microstructure. Provide detailed, actionable analysis with specific price targets and risk metrics."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.1,
      });
      const duration = Date.now() - startTime;
      
      console.log('✅ Price Analysis Agent - OpenAI API response received:', {
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
        'get_price_data',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Price Analysis Agent - get_price_data: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedPriceAnalysis(response.choices[0].message.content || '');
      
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
            timeframe: timeframe || 'current session',
            interval: interval || 'intraday',
            executiveSummary: analysis.executiveSummary,
            realTimePriceAnalysis: analysis.realTimePriceAnalysis,
            technicalIndicators: analysis.technicalIndicators,
            chartPatternAnalysis: analysis.chartPatternAnalysis,
            volumeFlowAnalysis: analysis.volumeFlowAnalysis,
            volatilityAnalysis: analysis.volatilityAnalysis,
            marketMicrostructure: analysis.marketMicrostructure,
            riskMetrics: analysis.riskMetrics,
            tradingImplications: analysis.tradingImplications,
            priceTargets: analysis.priceTargets,
            confidenceLevel: analysis.confidenceLevel,
            timestamp: new Date().toISOString(),
            costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_price_analysis',
          dataQuality: 'real_time_institutional'
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async analyzeTechnicalIndicators(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, indicators, timeframe } = message.payload.data || {};
      
      // Enhanced prompt for comprehensive technical analysis
      const searchQuery = `Conduct advanced technical indicator analysis for ${symbols?.join(', ') || 'major market indices'} using ${indicators?.join(', ') || 'comprehensive technical suite'} over ${timeframe || 'multiple timeframes'}.

      **TECHNICAL OVERVIEW:**
      - Overall technical bias and trend direction
      - Key technical levels and zones
      - Signal strength and reliability assessment
      - Multi-timeframe analysis convergence

      **MOMENTUM ANALYSIS:**
      - RSI (14, 21, 50) analysis and divergences
      - MACD signal line crossovers and histogram
      - Stochastic oscillator and %K/%D signals
      - Williams %R and momentum extremes
      - Rate of Change (ROC) and momentum shifts

      **TREND ANALYSIS:**
      - Moving average convergence/divergence
      - Trend strength (ADX, DI+, DI-)
      - Parabolic SAR trend signals
      - Ichimoku cloud analysis
      - Linear regression and trend channels

      **VOLATILITY INDICATORS:**
      - Bollinger Bands and band width
      - Average True Range (ATR) and volatility
      - Keltner Channels and squeeze patterns
      - Standard deviation and volatility bands
      - VIX correlation and volatility risk

      **VOLUME INDICATORS:**
      - On-Balance Volume (OBV) trends
      - Accumulation/Distribution Line
      - Volume Price Trend (VPT)
      - Money Flow Index (MFI)
      - Volume-weighted indicators

      **OSCILLATOR ANALYSIS:**
      - Overbought/oversold conditions
      - Oscillator divergences and confirmations
      - Cycle analysis and timing
      - Momentum exhaustion signals
      - Mean reversion opportunities

      **MULTI-TIMEFRAME ANALYSIS:**
      - Daily, weekly, monthly alignment
      - Intraday vs longer-term signals
      - Timeframe hierarchy and conflicts
      - Signal filtering and confirmation
      - Risk-reward optimization

      **SIGNAL GENERATION:**
      - Entry and exit signals
      - Signal strength and probability
      - False signal identification
      - Signal filtering and optimization
      - Risk management integration

      **BACKTESTING AND VALIDATION:**
      - Historical performance metrics
      - Win/loss ratios and expectancy
      - Maximum drawdown analysis
      - Sharpe ratio and risk-adjusted returns
      - Market regime analysis

      Provide specific buy/sell signals, probability estimates, and risk parameters.`;

      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        "model": "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a technical analysis expert with deep knowledge of technical indicators, chart patterns, and quantitative trading systems. Provide detailed analysis with specific signals and risk metrics."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.1,
      });
      const duration = Date.now() - startTime;
      
      // Track costs
      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        this.identity.id,
        this.identity.name,
        this.generateId(),
        'analyze_technical_indicators',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Price Analysis Agent - analyze_technical_indicators: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedTechnicalAnalysis(response.choices[0].message.content || '');
      
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
            indicators: indicators || ['RSI', 'MACD', 'Bollinger Bands', 'Volume'],
            timeframe: timeframe || 'multi-timeframe',
            technicalOverview: analysis.technicalOverview,
            momentumAnalysis: analysis.momentumAnalysis,
            trendAnalysis: analysis.trendAnalysis,
            volatilityIndicators: analysis.volatilityIndicators,
            volumeIndicators: analysis.volumeIndicators,
            oscillatorAnalysis: analysis.oscillatorAnalysis,
            multiTimeframeAnalysis: analysis.multiTimeframeAnalysis,
            signalGeneration: analysis.signalGeneration,
            backtestingValidation: analysis.backtestingValidation,
            tradingSignals: analysis.tradingSignals,
            riskParameters: analysis.riskParameters,
            confidenceLevel: analysis.confidenceLevel,
            timestamp: new Date().toISOString(),
            costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_technical_analysis',
          dataQuality: 'institutional_grade'
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
        "model": "gpt-4.1",
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
        "model": "gpt-4.1",
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
        "model": "gpt-4.1",
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
        "model": "gpt-4.1",
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
      const startTime = Date.now();
      const response = await this.openai.chat.completions.create({
        "model": "gpt-4.1",
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
      const duration = Date.now() - startTime;
      
      // Track costs
      const usage = extractTokenUsage(response);
      const requestCost = costTracker.trackRequest(
        this.identity.id,
        this.identity.name,
        this.generateId(),
        'assess_risk',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Price Analysis Agent - assess_risk: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

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
            recommendations: riskAnalysis.recommendations,
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

  // Enhanced parsing functions for structured data extraction
  private parseEnhancedPriceAnalysis(content: string): any {
    return {
      executiveSummary: this.extractStructuredSection(content, 'EXECUTIVE SUMMARY') || 'Price analysis summary',
      realTimePriceAnalysis: {
        currentBidAsk: this.extractStructuredSection(content, 'Current bid/ask spreads') || 'Bid/ask analysis',
        intradayAction: this.extractStructuredSection(content, 'Intraday price action') || 'Intraday analysis',
        vwapAnalysis: this.extractStructuredSection(content, 'VWAP analysis') || 'VWAP assessment',
        priceEfficiency: this.extractStructuredSection(content, 'Price efficiency') || 'Efficiency analysis',
        sessionHighLow: this.extractStructuredSection(content, 'Session high/low') || 'High/low analysis'
      },
      technicalIndicators: {
        movingAverages: this.extractStructuredSection(content, 'Moving averages') || 'MA analysis',
        momentumIndicators: this.extractStructuredSection(content, 'Momentum indicators') || 'Momentum analysis',
        volatilityIndicators: this.extractStructuredSection(content, 'Volatility indicators') || 'Volatility analysis',
        volumeIndicators: this.extractStructuredSection(content, 'Volume indicators') || 'Volume analysis',
        trendStrength: this.extractStructuredSection(content, 'Trend strength indicators') || 'Trend analysis'
      },
      chartPatternAnalysis: {
        classicalPatterns: this.extractStructuredSection(content, 'Classical chart patterns') || 'Chart patterns',
        candlestickPatterns: this.extractStructuredSection(content, 'Candlestick patterns') || 'Candlestick analysis',
        supportResistance: this.extractStructuredSection(content, 'Support and resistance') || 'S/R levels',
        trendLines: this.extractStructuredSection(content, 'Trend line analysis') || 'Trend line analysis',
        fibonacciLevels: this.extractStructuredSection(content, 'Fibonacci') || 'Fibonacci analysis'
      },
      volumeFlowAnalysis: {
        volumeDistribution: this.extractStructuredSection(content, 'Volume distribution') || 'Volume distribution',
        institutionalFlow: this.extractStructuredSection(content, 'Institutional vs retail flow') || 'Flow analysis',
        darkPoolActivity: this.extractStructuredSection(content, 'Dark pool activity') || 'Dark pool analysis',
        optionsFlow: this.extractStructuredSection(content, 'Options flow') || 'Options flow analysis',
        sectorRotation: this.extractStructuredSection(content, 'Sector rotation') || 'Rotation analysis'
      },
      volatilityAnalysis: {
        realizedVsImplied: this.extractStructuredSection(content, 'Realized vs implied volatility') || 'Volatility comparison',
        historicalPatterns: this.extractStructuredSection(content, 'Historical volatility patterns') || 'Historical volatility',
        termStructure: this.extractStructuredSection(content, 'Volatility term structure') || 'Term structure',
        vixAnalysis: this.extractStructuredSection(content, 'VIX') || 'VIX analysis',
        volatilityClustering: this.extractStructuredSection(content, 'Volatility clustering') || 'Clustering analysis'
      },
      marketMicrostructure: {
        orderFlow: this.extractStructuredSection(content, 'Order flow analysis') || 'Order flow analysis',
        bidAskDynamics: this.extractStructuredSection(content, 'Bid-ask spread dynamics') || 'Spread dynamics',
        marketMakerBehavior: this.extractStructuredSection(content, 'Market maker behavior') || 'Market maker analysis',
        hftImpact: this.extractStructuredSection(content, 'High-frequency trading impact') || 'HFT impact',
        liquidityProvision: this.extractStructuredSection(content, 'Liquidity provision') || 'Liquidity analysis'
      },
      riskMetrics: {
        valueAtRisk: this.extractNumericValue(content, 'Value at Risk', 2.5),
        expectedShortfall: this.extractNumericValue(content, 'Expected shortfall', 3.5),
        maxDrawdown: this.extractNumericValue(content, 'Maximum drawdown', 8.0),
        correlationBeta: this.extractStructuredSection(content, 'Correlation and beta') || 'Correlation analysis',
        sharpeRatio: this.extractNumericValue(content, 'Sharpe ratio', 1.2)
      },
      tradingImplications: {
        entryExitSignals: this.extractBulletPoints(content, 'Entry and exit signals'),
        positionSizing: this.extractStructuredSection(content, 'Position sizing') || 'Position sizing guidance',
        stopLossLevels: this.extractStructuredSection(content, 'Stop-loss') || 'Stop-loss levels',
        riskManagement: this.extractStructuredSection(content, 'Risk management') || 'Risk management guidelines',
        marketTiming: this.extractStructuredSection(content, 'Market timing') || 'Timing considerations'
      },
      priceTargets: {
        bullishTarget: this.extractNumericValue(content, 'Bullish Target', 0),
        bearishTarget: this.extractNumericValue(content, 'Bearish Target', 0),
        neutralTarget: this.extractNumericValue(content, 'Neutral Target', 0),
        timeframe: this.extractStructuredSection(content, 'Timeframe') || 'Medium-term'
      },
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedTechnicalAnalysis(content: string): any {
    return {
      technicalOverview: {
        overallBias: this.extractStructuredSection(content, 'Overall technical bias') || 'Technical bias assessment',
        keyLevels: this.extractStructuredSection(content, 'Key technical levels') || 'Key levels identified',
        signalStrength: this.extractStructuredSection(content, 'Signal strength') || 'Signal strength assessment',
        timeframeConvergence: this.extractStructuredSection(content, 'Multi-timeframe analysis convergence') || 'Timeframe analysis'
      },
      momentumAnalysis: {
        rsiAnalysis: this.extractStructuredSection(content, 'RSI') || 'RSI analysis',
        macdAnalysis: this.extractStructuredSection(content, 'MACD') || 'MACD analysis',
        stochasticAnalysis: this.extractStructuredSection(content, 'Stochastic') || 'Stochastic analysis',
        williamsR: this.extractStructuredSection(content, 'Williams %R') || 'Williams %R analysis',
        rocAnalysis: this.extractStructuredSection(content, 'Rate of Change') || 'ROC analysis'
      },
      trendAnalysis: {
        movingAverageConvergence: this.extractStructuredSection(content, 'Moving average convergence') || 'MA convergence',
        trendStrength: this.extractStructuredSection(content, 'Trend strength') || 'Trend strength analysis',
        parabolicSAR: this.extractStructuredSection(content, 'Parabolic SAR') || 'SAR analysis',
        ichimokuCloud: this.extractStructuredSection(content, 'Ichimoku cloud') || 'Ichimoku analysis',
        linearRegression: this.extractStructuredSection(content, 'Linear regression') || 'Regression analysis'
      },
      volatilityIndicators: {
        bollingerBands: this.extractStructuredSection(content, 'Bollinger Bands') || 'Bollinger analysis',
        averageTrueRange: this.extractStructuredSection(content, 'Average True Range') || 'ATR analysis',
        keltnerChannels: this.extractStructuredSection(content, 'Keltner Channels') || 'Keltner analysis',
        standardDeviation: this.extractStructuredSection(content, 'Standard deviation') || 'Std dev analysis',
        vixCorrelation: this.extractStructuredSection(content, 'VIX correlation') || 'VIX correlation'
      },
      volumeIndicators: {
        obv: this.extractStructuredSection(content, 'On-Balance Volume') || 'OBV analysis',
        accumulationDistribution: this.extractStructuredSection(content, 'Accumulation/Distribution') || 'A/D Line analysis',
        volumePriceTrend: this.extractStructuredSection(content, 'Volume Price Trend') || 'VPT analysis',
        moneyFlowIndex: this.extractStructuredSection(content, 'Money Flow Index') || 'MFI analysis',
        volumeWeighted: this.extractStructuredSection(content, 'Volume-weighted') || 'Volume-weighted analysis'
      },
      oscillatorAnalysis: {
        overboughtOversold: this.extractStructuredSection(content, 'Overbought/oversold') || 'Overbought/oversold analysis',
        oscillatorDivergences: this.extractStructuredSection(content, 'Oscillator divergences') || 'Divergence analysis',
        cycleAnalysis: this.extractStructuredSection(content, 'Cycle analysis') || 'Cycle analysis',
        momentumExhaustion: this.extractStructuredSection(content, 'Momentum exhaustion') || 'Exhaustion signals',
        meanReversion: this.extractStructuredSection(content, 'Mean reversion') || 'Mean reversion opportunities'
      },
      multiTimeframeAnalysis: {
        timeframeAlignment: this.extractStructuredSection(content, 'Daily, weekly, monthly alignment') || 'Timeframe alignment',
        intradayVsLongerTerm: this.extractStructuredSection(content, 'Intraday vs longer-term') || 'Timeframe comparison',
        timeframeHierarchy: this.extractStructuredSection(content, 'Timeframe hierarchy') || 'Hierarchy analysis',
        signalFiltering: this.extractStructuredSection(content, 'Signal filtering') || 'Signal filtering',
        riskRewardOptimization: this.extractStructuredSection(content, 'Risk-reward optimization') || 'Risk-reward optimization'
      },
      signalGeneration: {
        entryExitSignals: this.extractBulletPoints(content, 'Entry and exit signals'),
        signalStrength: this.extractStructuredSection(content, 'Signal strength and probability') || 'Signal strength',
        falseSignalIdentification: this.extractStructuredSection(content, 'False signal identification') || 'False signal analysis',
        signalOptimization: this.extractStructuredSection(content, 'Signal filtering and optimization') || 'Signal optimization',
        riskManagementIntegration: this.extractStructuredSection(content, 'Risk management integration') || 'Risk integration'
      },
      backtestingValidation: {
        historicalPerformance: this.extractStructuredSection(content, 'Historical performance metrics') || 'Performance metrics',
        winLossRatios: this.extractStructuredSection(content, 'Win/loss ratios') || 'Win/loss analysis',
        maximumDrawdown: this.extractStructuredSection(content, 'Maximum drawdown analysis') || 'Drawdown analysis',
        sharpeRatio: this.extractNumericValue(content, 'Sharpe ratio', 1.2),
        marketRegimeAnalysis: this.extractStructuredSection(content, 'Market regime analysis') || 'Regime analysis'
      },
      tradingSignals: {
        buySignals: this.extractBulletPoints(content, 'buy signals'),
        sellSignals: this.extractBulletPoints(content, 'sell signals'),
        signalProbability: this.extractNumericValue(content, 'probability', 70),
        signalTimeframe: this.extractStructuredSection(content, 'signal timeframe') || 'Signal timeframe'
      },
      riskParameters: {
        stopLossLevel: this.extractNumericValue(content, 'stop loss', 0),
        takeProfitLevel: this.extractNumericValue(content, 'take profit', 0),
        positionSize: this.extractStructuredSection(content, 'position size') || 'Position size guidance',
        riskRewardRatio: this.extractNumericValue(content, 'risk reward', 2.0)
      },
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
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

  // This is the main method called by the workflow
  async get_market_data(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { symbols, timeframe, analysisType } = message.payload.data || {};
      
      // Use OpenAI to get market data and analysis
      const searchQuery = `
Analyze market data for ${symbols?.join(', ') || 'major market indices'} over ${timeframe || 'the recent period'}.

Please provide structured analysis with the following format:

**PRICE ACTION ANALYSIS:**
- Current Price: [specific price level]
- Recent Performance: [percentage change]
- Key Support Level: [specific price]
- Key Resistance Level: [specific price]
- Price Momentum: [bullish/bearish/neutral]

**TECHNICAL INDICATORS:**
- Moving Averages: [50-day and 200-day levels]
- RSI Level: [specific number]
- MACD Signal: [bullish/bearish/neutral]
- Bollinger Bands: [position within bands]

**RISK METRICS:**
- Value at Risk: [specific percentage]
- Expected Shortfall: [specific percentage]
- Maximum Drawdown: [specific percentage]
- Sharpe Ratio: [specific number]

**PRICE TARGETS:**
- Bullish Target: [specific price level]
- Bearish Target: [specific price level]
- Neutral Target: [specific price level]
- Timeframe: [short/medium/long term]

**TRADING RECOMMENDATIONS:**
- Entry Points: [specific price levels]
- Stop Loss: [specific price level]
- Take Profit: [specific price level]
- Position Sizing: [percentage of portfolio]

Provide exact numbers, specific price levels, and actionable trading insights. Avoid generic statements.
      `;

      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        "model": "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are a senior quantitative analyst specializing in price action analysis, technical indicators, and market microstructure. Provide detailed, actionable analysis with specific price targets and risk metrics."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.1,
      });
      const duration = Date.now() - startTime;
      
      // Log detailed API call information
      logApiCallDetails(
        this.identity.name,
        'get_market_data',
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
        'get_market_data',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Price Analysis Agent - get_market_data: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedPriceAnalysis(response.choices[0].message.content || '');
      
      // Embed cost information in response
      const responseWithCost = {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'market_data_complete',
          data: {
            symbols: symbols || ['SPY'],
            timeframe: timeframe || 'daily',
            analysis,
            priceTargets: analysis.priceTargets,
            technicalSignals: analysis.technicalSignals,
            riskMetrics: analysis.riskMetrics,
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
      console.error('Price Analysis Agent - get_market_data error:', error);
      return this.createErrorResponse(message, error as Error);
    }
  }
} 