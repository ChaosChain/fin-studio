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
import { costTracker, extractTokenUsage, logApiCallDetails } from '@/lib/cost-tracker';

export class MacroResearchAgent {
  private openai: OpenAI;
  private identity: AgentIdentity;
  private model: string = 'gpt-4.1-2025-04-14'; // Default model

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

  /**
   * Set the AI model for this agent instance
   */
  setModel(model: string): void {
    this.model = model;
    console.log(`MacroResearchAgent model set to: ${model}`);
  }

  /**
   * Get the current AI model
   */
  getModel(): string {
    return this.model;
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
      const { indicators, regions, timeframe } = message.payload.data || {};

      // Enhanced prompt for comprehensive economic indicators analysis
      const searchQuery = `
Analyze economic indicators for ${regions?.join(', ') || 'major economies'} focusing on ${indicators?.join(', ') || 'key economic indicators'} over ${timeframe || 'the recent period'}.

Please provide structured analysis with the following format:

**ECONOMIC INDICATORS OVERVIEW:**
- GDP Growth Rate: [specific percentage]
- Inflation Rate: [specific percentage] 
- Unemployment Rate: [specific percentage]
- Interest Rate: [specific percentage]
- Manufacturing PMI: [specific number]
- Consumer Confidence: [specific index]

**MONETARY POLICY IMPLICATIONS:**
- Current Policy Stance: [hawkish/dovish/neutral]
- Expected Rate Trajectory: [specific assessment]
- Policy Effectiveness: [assessment]
- Currency Impact: [specific effects]

**INFLATION & GROWTH DYNAMICS:**
- Core vs Headline Inflation: [specific numbers]
- Growth Sustainability: [assessment]
- Labor Market Strength: [specific metrics]
- Productivity Trends: [specific data]

**MARKET IMPLICATIONS:**
- Bond Market Impact: [specific effects]
- Equity Sector Rotation: [which sectors]
- Currency Movements: [specific trends]
- Risk Asset Allocation: [recommendations]

**FORWARD-LOOKING ASSESSMENT:**
- Economic Cycle Position: [expansion/contraction]
- Recession Probability: [specific percentage]
- Key Risk Factors: [specific concerns]
- Investment Strategy: [specific recommendations]

Provide exact numbers, percentages, and specific assessments. Avoid generic statements.
      `;

      const startTime = Date.now();
      console.log('🚀 Macro Research Agent - Making OpenAI API call:', {
        "model": this.model,
        action: 'analyze_economic_indicators',
        maxTokens: 4096,
        temperature: 0.2,
        promptLength: searchQuery.length
      });

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a senior macroeconomic analyst with expertise in economic indicators, central bank policy, and economic assessment. Provide detailed, professional analysis with specific metrics and actionable insights."
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

      // Log detailed API call information
      logApiCallDetails(
        this.identity.name,
        'analyze_economic_indicators',
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
        'analyze_economic_indicators',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Macro Research Agent - analyze_economic_indicators: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedEconomicAnalysis(response.choices[0].message.content || '');

      // Embed cost information in response
      const responseWithCost = {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'economic_indicators_complete',
          data: {
            indicators: indicators || ['GDP', 'CPI', 'Employment'],
            regions: regions || ['US', 'EU', 'China'],
            analysis,
            keyInsights: analysis.keyInsights,
            recommendations: analysis.recommendations,
            riskFactors: analysis.riskFactors,
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
      console.error('Macro Research Agent - analyze_economic_indicators error:', error);
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async analyzeCentralBankPolicy(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { centralBank, policyType } = message.payload.data || {};

      // Enhanced prompt for comprehensive central bank policy analysis
      const searchQuery = `Provide comprehensive central bank policy analysis for ${centralBank || 'Federal Reserve'} focusing on ${policyType || 'monetary policy decisions'}.

      **POLICY OVERVIEW:**
      - Current policy stance and rates
      - Recent policy actions and statements
      - Policy committee composition and voting patterns
      - Communication strategy and forward guidance

      **POLICY FRAMEWORK ANALYSIS:**
      - Policy objectives and mandate
      - Decision-making process and tools
      - Policy transmission mechanisms
      - Effectiveness of current framework

      **RECENT POLICY ACTIONS:**
      - Interest rate decisions and rationale
      - Quantitative easing/tightening measures
      - Forward guidance evolution
      - Emergency policy responses

      **ECONOMIC JUSTIFICATION:**
      - Economic data driving decisions
      - Inflation targeting vs actual inflation
      - Employment mandate assessment
      - Financial stability considerations

      **MARKET IMPACT ASSESSMENT:**
      - Bond market reaction and yield curve
      - Equity market sector rotation effects
      - Currency impact and international flows
      - Credit market conditions and spreads

      **POLICY EFFECTIVENESS:**
      - Achievement of stated objectives
      - Unintended consequences and side effects
      - Policy lag effects and timing
      - Comparative international analysis

      **FUTURE POLICY OUTLOOK:**
      - Expected policy trajectory
      - Key data points and triggers
      - Market expectations vs likely reality
      - Policy normalization timeline

      **RISK FACTORS:**
      - Policy error risks
      - External constraint factors
      - Political and institutional risks
      - Market function and liquidity risks

      **INVESTMENT IMPLICATIONS:**
      - Asset allocation recommendations
      - Sector and style preferences
      - Duration and credit positioning
      - Currency and commodity impacts

      Provide specific rate assessments, timing, and probability evaluations.`;

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a central bank policy expert with deep understanding of monetary policy, financial markets, and economic theory. Provide detailed policy analysis with specific assessments and market implications."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.2,
      });

      const analysis = this.parseEnhancedPolicyAnalysis(response.choices[0].message.content || '');

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
            policyType: policyType || 'monetary policy',
            policyOverview: analysis.policyOverview,
            policyFramework: analysis.policyFramework,
            recentActions: analysis.recentActions,
            economicJustification: analysis.economicJustification,
            marketImpact: analysis.marketImpact,
            policyEffectiveness: analysis.policyEffectiveness,
            futureOutlook: analysis.futureOutlook,
            riskFactors: analysis.riskFactors,
            investmentImplications: analysis.investmentImplications,
            keyAssessments: analysis.keyAssessments,
            confidenceLevel: analysis.confidenceLevel,
            timestamp: new Date().toISOString()
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_central_bank_policy',
          dataQuality: 'expert_grade'
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async analyzeGDPTrends(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { countries, timeframe } = message.payload.data || {};

      // Enhanced prompt for comprehensive GDP analysis
      const searchQuery = `Conduct comprehensive GDP growth analysis for ${countries?.join(', ') || 'major economies'} over ${timeframe || 'recent quarters'}.

      **GDP OVERVIEW:**
      - Current GDP growth rates (QoQ and YoY)
      - GDP per capita and productivity metrics
      - Nominal vs real GDP trends
      - GDP deflator and price trends

      **GROWTH COMPOSITION ANALYSIS:**
      - Consumer spending contribution
      - Business investment patterns
      - Government spending impact
      - Net exports and trade balance
      - Inventory changes and timing effects

      **SECTORAL BREAKDOWN:**
      - Services sector contribution
      - Manufacturing and industrial output
      - Agriculture and commodities
      - Construction and real estate
      - Technology and innovation sectors

      **PRODUCTIVITY ANALYSIS:**
      - Labor productivity trends
      - Total factor productivity
      - Capital deepening effects
      - Technology adoption impacts
      - Skills and education factors

      **COMPARATIVE ANALYSIS:**
      - Regional growth comparisons
      - Developed vs emerging markets
      - Historical growth context
      - Potential GDP vs actual output
      - Output gap analysis

      **LEADING INDICATORS:**
      - Employment and wage trends
      - Business investment intentions
      - Consumer confidence indicators
      - Manufacturing and services PMI
      - Financial conditions impact

      **STRUCTURAL FACTORS:**
      - Demographics and labor force
      - Infrastructure and capital stock
      - Institutional quality factors
      - Trade and globalization effects
      - Environmental and sustainability issues

      **GROWTH OUTLOOK:**
      - Short-term growth assessments
      - Medium-term potential estimates
      - Long-term secular trends
      - Recession risk assessment
      - Recovery pathway analysis

      **POLICY IMPLICATIONS:**
      - Fiscal policy effectiveness
      - Monetary policy transmission
      - Structural reform needs
      - Investment priorities
      - Trade and competitiveness

      Provide specific growth assessments, confidence intervals, and policy recommendations.`;

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a GDP and economic growth specialist with expertise in national accounts, productivity analysis, and growth theory. Provide detailed growth analysis with specific assessments and policy insights."
          },
          {
            role: "user",
            content: searchQuery
          }
        ],
        max_tokens: 3500,
        temperature: 0.2,
      });

      const analysis = this.parseEnhancedGDPAnalysis(response.choices[0].message.content || '');

      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'gdp_analysis_complete',
          data: {
            countries: countries || ['United States', 'European Union', 'China', 'Japan'],
            timeframe: timeframe || 'recent quarters',
            gdpOverview: analysis.gdpOverview,
            growthComposition: analysis.growthComposition,
            sectoralBreakdown: analysis.sectoralBreakdown,
            productivityAnalysis: analysis.productivityAnalysis,
            comparativeAnalysis: analysis.comparativeAnalysis,
            leadingIndicators: analysis.leadingIndicators,
            structuralFactors: analysis.structuralFactors,
            growthOutlook: analysis.growthOutlook,
            policyImplications: analysis.policyImplications,
                      keyMetrics: analysis.keyMetrics,
          assessments: analysis.assessments,
          confidenceLevel: analysis.confidenceLevel,
          timestamp: new Date().toISOString()
        },
        context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_gdp_analysis',
          dataQuality: 'institutional_grade'
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  private async analyzeInflation(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { region, inflationType } = message.payload.data || {};

      // Enhanced prompt for comprehensive inflation analysis
      const searchQuery = `Provide comprehensive inflation analysis for ${region || 'major economies'} focusing on ${inflationType || 'CPI and core inflation'}.

      **INFLATION OVERVIEW:**
      - Current inflation rates (headline and core)
      - Recent inflation trends and trajectories
      - Inflation expectations (market-based and survey)
      - Central bank inflation targets and deviations

      **INFLATION COMPOSITION:**
      - Food and energy price contributions
      - Housing and shelter costs
      - Services vs goods inflation
      - Durable vs non-durable goods
      - Regional and demographic variations

      **INFLATION DRIVERS:**
      - Supply chain and logistics factors
      - Labor market tightness and wage growth
      - Monetary policy and money supply
      - Fiscal policy and government spending
      - Exchange rate and import price effects

      **INFLATION EXPECTATIONS:**
      - Short-term vs long-term expectations
      - Market-based measures (TIPS, breakevens)
      - Survey-based measures (consumers, businesses)
      - Central bank credibility assessment
      - Anchoring effectiveness analysis

      **HISTORICAL CONTEXT:**
      - Inflation cycles and patterns
      - Comparison to past episodes
      - Secular trends and structural changes
      - International comparisons
      - Regime changes and policy shifts

      **TRANSMISSION MECHANISMS:**
      - Wage-price spiral dynamics
      - Pass-through from costs to prices
      - Monetary policy transmission
      - Exchange rate pass-through
      - Expectation formation processes

      **SECTORAL ANALYSIS:**
      - Housing and real estate inflation
      - Healthcare and education costs
      - Transportation and energy
      - Food and commodity prices
      - Technology and digital services

      **POLICY RESPONSE:**
      - Central bank policy reactions
      - Fiscal policy considerations
      - Structural reform measures
      - International coordination
      - Communication strategies

      **INFLATION OUTLOOK:**
      - Short-term inflation assessments
      - Medium-term inflation path
      - Long-term inflation anchoring
      - Risk factors and scenarios
      - Policy effectiveness assessment

      Provide specific inflation assessments, probability ranges, and policy recommendations.`;

      const startTime = Date.now();
      console.log('🚀 Macro Research Agent - Making OpenAI API call:', {
        "model": this.model,
        action: 'analyze_inflation',
        maxTokens: 4096,
        temperature: 0.2,
        promptLength: searchQuery.length
      });

      const response = await this.openai.chat.completions.create({
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are an inflation specialist with expertise in price dynamics, monetary economics, and inflation assessment. Provide detailed inflation analysis with specific assessments and policy insights."
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

      console.log('✅ Macro Research Agent - OpenAI API response received:', {
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
        'analyze_inflation',
        'gpt-4',
        usage,
        duration
      );
      console.log(`💰 Macro Research Agent - analyze_inflation: ${costTracker.formatCost(requestCost.totalCost)} (${costTracker.formatTokens(requestCost.totalTokens)} tokens)`);

      const analysis = this.parseEnhancedInflationAnalysis(response.choices[0].message.content || '');

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
            inflationType: inflationType || 'CPI and core inflation',
            inflationOverview: analysis.inflationOverview,
            inflationComposition: analysis.inflationComposition,
            inflationDrivers: analysis.inflationDrivers,
            inflationExpectations: analysis.inflationExpectations,
            historicalContext: analysis.historicalContext,
            transmissionMechanisms: analysis.transmissionMechanisms,
            sectoralAnalysis: analysis.sectoralAnalysis,
            policyResponse: analysis.policyResponse,
            inflationOutlook: analysis.inflationOutlook,
                      keyMetrics: analysis.keyMetrics,
          assessments: analysis.assessments,
          confidenceLevel: analysis.confidenceLevel,
          timestamp: new Date().toISOString(),
          costInfo: requestCost
          },
          context: message.payload.context
        },
        metadata: {
          responseToMessageId: message.id,
          analysisType: 'comprehensive_inflation_analysis',
          dataQuality: 'expert_grade'
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
        "model": this.model,
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
        "model": this.model,
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
        "model": this.model,
        messages: [
          {
            role: "system",
            content: "You are a chief economist. Provide comprehensive macroeconomic outlook and assessments."
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
        "model": this.model,
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

  // Enhanced parsing functions for structured data extraction
  private parseEnhancedEconomicAnalysis(content: string): any {
    // Extract specific economic indicators from structured response
    const gdpGrowth = this.extractNumericValue(content, 'GDP Growth Rate', 2.5);
    const inflationRate = this.extractNumericValue(content, 'Inflation Rate', 3.0);
    const unemploymentRate = this.extractNumericValue(content, 'Unemployment Rate', 3.8);
    const interestRate = this.extractNumericValue(content, 'Interest Rate', 4.0);

    // Extract policy stance and trajectory
    const policyStance = this.extractStructuredSection(content, 'Current Policy Stance') || 'neutral';
    const rateTrajectory = this.extractStructuredSection(content, 'Expected Rate Trajectory') || 'stable';

    // Extract market implications
    const bondImpact = this.extractStructuredSection(content, 'Bond Market Impact') || 'Bond market analysis';
    const sectorRotation = this.extractStructuredSection(content, 'Equity Sector Rotation') || 'Sector rotation analysis';

    // Extract forward-looking assessment
    const economicCycle = this.extractStructuredSection(content, 'Economic Cycle Position') || 'expansion';
    const recessionProbability = this.extractNumericValue(content, 'Recession Probability', 25);

    return {
      indicators: {
        gdpGrowth: gdpGrowth,
        inflationRate: inflationRate,
        unemploymentRate: unemploymentRate,
        interestRate: interestRate
      },
      analysis: {
        policyStance: policyStance,
        rateTrajectory: rateTrajectory,
        bondImpact: bondImpact,
        sectorRotation: sectorRotation,
        economicCycle: economicCycle,
        recessionProbability: recessionProbability
      },
      recommendations: this.extractBulletPoints(content, 'Investment Strategy'),
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedPolicyAnalysis(content: string): any {
    return {
      policyOverview: {
        currentStance: this.extractStructuredSection(content, 'Current policy stance') || 'Policy stance analysis',
        recentActions: this.extractStructuredSection(content, 'Recent policy actions') || 'Recent actions summary',
        committeeComposition: this.extractStructuredSection(content, 'Policy committee composition') || 'Committee analysis',
        communicationStrategy: this.extractStructuredSection(content, 'Communication strategy') || 'Communication assessment'
      },
      policyFramework: {
        objectives: this.extractStructuredSection(content, 'Policy objectives') || 'Objectives analysis',
        decisionProcess: this.extractStructuredSection(content, 'Decision-making process') || 'Process analysis',
        transmissionMechanisms: this.extractStructuredSection(content, 'Policy transmission mechanisms') || 'Transmission analysis',
        frameworkEffectiveness: this.extractStructuredSection(content, 'Effectiveness of current framework') || 'Framework assessment'
      },
      recentActions: {
        interestRateDecisions: this.extractStructuredSection(content, 'Interest rate decisions') || 'Rate decisions',
        quantitativeMeasures: this.extractStructuredSection(content, 'Quantitative easing') || 'QE measures',
        forwardGuidance: this.extractStructuredSection(content, 'Forward guidance evolution') || 'Guidance analysis',
        emergencyResponses: this.extractStructuredSection(content, 'Emergency policy responses') || 'Emergency measures'
      },
      economicJustification: {
        dataDrivers: this.extractStructuredSection(content, 'Economic data driving decisions') || 'Data analysis',
        inflationTargeting: this.extractStructuredSection(content, 'Inflation targeting') || 'Inflation assessment',
        employmentMandate: this.extractStructuredSection(content, 'Employment mandate') || 'Employment analysis',
        financialStability: this.extractStructuredSection(content, 'Financial stability') || 'Stability considerations'
      },
      marketImpact: {
        bondReaction: this.extractStructuredSection(content, 'Bond market reaction') || 'Bond market impact',
        equityEffects: this.extractStructuredSection(content, 'Equity market sector rotation') || 'Equity effects',
        currencyImpact: this.extractStructuredSection(content, 'Currency impact') || 'Currency effects',
        creditConditions: this.extractStructuredSection(content, 'Credit market conditions') || 'Credit impact'
      },
      policyEffectiveness: {
        objectiveAchievement: this.extractStructuredSection(content, 'Achievement of stated objectives') || 'Objective assessment',
        unintendedConsequences: this.extractStructuredSection(content, 'Unintended consequences') || 'Side effects analysis',
        policyLags: this.extractStructuredSection(content, 'Policy lag effects') || 'Timing analysis',
        internationalComparison: this.extractStructuredSection(content, 'Comparative international analysis') || 'International comparison'
      },
      futureOutlook: {
        expectedTrajectory: this.extractStructuredSection(content, 'Expected policy trajectory') || 'Policy outlook',
        keyTriggers: this.extractBulletPoints(content, 'Key data points and triggers'),
        marketExpectations: this.extractStructuredSection(content, 'Market expectations vs likely reality') || 'Expectations analysis',
        normalizationTimeline: this.extractStructuredSection(content, 'Policy normalization timeline') || 'Normalization path'
      },
      riskFactors: {
        policyErrorRisks: this.extractBulletPoints(content, 'Policy error risks'),
        externalConstraints: this.extractBulletPoints(content, 'External constraint factors'),
        politicalRisks: this.extractBulletPoints(content, 'Political and institutional risks'),
        marketRisks: this.extractBulletPoints(content, 'Market function and liquidity risks')
      },
      investmentImplications: {
        assetAllocation: this.extractStructuredSection(content, 'Asset allocation recommendations') || 'Allocation guidance',
        sectorPreferences: this.extractStructuredSection(content, 'Sector and style preferences') || 'Sector recommendations',
        durationCredit: this.extractStructuredSection(content, 'Duration and credit positioning') || 'Fixed income positioning',
        currencyCommodity: this.extractStructuredSection(content, 'Currency and commodity impacts') || 'Currency/commodity effects'
      },
      keyAssessments: {
        nextRateDecision: this.extractStructuredSection(content, 'rate assessments') || 'Rate assessment',
        probabilityAssessment: this.extractNumericValue(content, 'probability', 60),
        timingEstimate: this.extractStructuredSection(content, 'timing') || 'Timing assessment'
      },
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedGDPAnalysis(content: string): any {
    return {
      gdpOverview: {
        currentGrowthRates: this.extractStructuredSection(content, 'Current GDP growth rates') || 'Growth rates analysis',
        gdpPerCapita: this.extractStructuredSection(content, 'GDP per capita') || 'Per capita analysis',
        nominalVsReal: this.extractStructuredSection(content, 'Nominal vs real GDP') || 'Nominal vs real comparison',
        priceDeflator: this.extractStructuredSection(content, 'GDP deflator') || 'Price trends analysis'
      },
      growthComposition: {
        consumerSpending: this.extractStructuredSection(content, 'Consumer spending contribution') || 'Consumer analysis',
        businessInvestment: this.extractStructuredSection(content, 'Business investment patterns') || 'Investment analysis',
        governmentSpending: this.extractStructuredSection(content, 'Government spending impact') || 'Government analysis',
        netExports: this.extractStructuredSection(content, 'Net exports and trade balance') || 'Trade analysis',
        inventoryChanges: this.extractStructuredSection(content, 'Inventory changes') || 'Inventory analysis'
      },
      sectoralBreakdown: {
        servicesSector: this.extractStructuredSection(content, 'Services sector contribution') || 'Services analysis',
        manufacturing: this.extractStructuredSection(content, 'Manufacturing and industrial output') || 'Manufacturing analysis',
        agriculture: this.extractStructuredSection(content, 'Agriculture and commodities') || 'Agriculture analysis',
        construction: this.extractStructuredSection(content, 'Construction and real estate') || 'Construction analysis',
        technology: this.extractStructuredSection(content, 'Technology and innovation sectors') || 'Technology analysis'
      },
      productivityAnalysis: {
        laborProductivity: this.extractStructuredSection(content, 'Labor productivity trends') || 'Labor productivity analysis',
        totalFactorProductivity: this.extractStructuredSection(content, 'Total factor productivity') || 'TFP analysis',
        capitalDeepening: this.extractStructuredSection(content, 'Capital deepening effects') || 'Capital analysis',
        technologyAdoption: this.extractStructuredSection(content, 'Technology adoption impacts') || 'Technology impact',
        skillsEducation: this.extractStructuredSection(content, 'Skills and education factors') || 'Human capital analysis'
      },
      comparativeAnalysis: {
        regionalComparisons: this.extractStructuredSection(content, 'Regional growth comparisons') || 'Regional analysis',
        developedVsEmerging: this.extractStructuredSection(content, 'Developed vs emerging markets') || 'Market comparison',
        historicalContext: this.extractStructuredSection(content, 'Historical growth context') || 'Historical analysis',
        potentialVsActual: this.extractStructuredSection(content, 'Potential GDP vs actual output') || 'Potential GDP analysis',
        outputGap: this.extractStructuredSection(content, 'Output gap analysis') || 'Output gap assessment'
      },
      leadingIndicators: {
        employmentWages: this.extractStructuredSection(content, 'Employment and wage trends') || 'Employment indicators',
        businessInvestment: this.extractStructuredSection(content, 'Business investment intentions') || 'Investment intentions',
        consumerConfidence: this.extractStructuredSection(content, 'Consumer confidence indicators') || 'Consumer sentiment',
        pmiIndicators: this.extractStructuredSection(content, 'Manufacturing and services PMI') || 'PMI analysis',
        financialConditions: this.extractStructuredSection(content, 'Financial conditions impact') || 'Financial conditions'
      },
      structuralFactors: {
        demographics: this.extractStructuredSection(content, 'Demographics and labor force') || 'Demographic analysis',
        infrastructure: this.extractStructuredSection(content, 'Infrastructure and capital stock') || 'Infrastructure analysis',
        institutionalQuality: this.extractStructuredSection(content, 'Institutional quality factors') || 'Institutional factors',
        tradeGlobalization: this.extractStructuredSection(content, 'Trade and globalization effects') || 'Trade analysis',
        environmental: this.extractStructuredSection(content, 'Environmental and sustainability') || 'Environmental factors'
      },
      growthOutlook: {
        shortTermAssessment: this.extractStructuredSection(content, 'Short-term growth assessments') || 'Short-term outlook',
        mediumTermPotential: this.extractStructuredSection(content, 'Medium-term potential estimates') || 'Medium-term potential',
        longTermTrends: this.extractStructuredSection(content, 'Long-term secular trends') || 'Long-term trends',
        recessionRisk: this.extractStructuredSection(content, 'Recession risk assessment') || 'Recession risk',
        recoveryPathway: this.extractStructuredSection(content, 'Recovery pathway analysis') || 'Recovery analysis'
      },
      policyImplications: {
        fiscalPolicy: this.extractStructuredSection(content, 'Fiscal policy effectiveness') || 'Fiscal policy analysis',
        monetaryPolicy: this.extractStructuredSection(content, 'Monetary policy transmission') || 'Monetary policy analysis',
        structuralReforms: this.extractStructuredSection(content, 'Structural reform needs') || 'Reform analysis',
        investmentPriorities: this.extractStructuredSection(content, 'Investment priorities') || 'Investment analysis',
        tradeCompetitiveness: this.extractStructuredSection(content, 'Trade and competitiveness') || 'Competitiveness analysis'
      },
      keyMetrics: {
        currentGrowthRate: this.extractNumericValue(content, 'GDP growth', 2.5),
        assessedGrowthRate: this.extractNumericValue(content, 'assessment', 2.0),
        potentialGrowthRate: this.extractNumericValue(content, 'potential', 2.2),
        outputGap: this.extractNumericValue(content, 'output gap', 0.0)
      },
      assessments: {
        nextQuarter: this.extractNumericValue(content, 'next quarter', 2.0),
        nextYear: this.extractNumericValue(content, 'next year', 2.5),
        confidenceInterval: this.extractStructuredSection(content, 'confidence interval') || '±0.5%'
      },
      confidenceLevel: this.extractNumericValue(content, 'confidence', 7.5)
    };
  }

  private parseEnhancedInflationAnalysis(content: string): any {
    return {
      inflationOverview: {
        currentRates: this.extractStructuredSection(content, 'Current inflation rates') || 'Current inflation analysis',
        recentTrends: this.extractStructuredSection(content, 'Recent inflation trends') || 'Trend analysis',
        expectations: this.extractStructuredSection(content, 'Inflation expectations') || 'Expectations analysis',
        targetDeviations: this.extractStructuredSection(content, 'Central bank inflation targets') || 'Target analysis'
      },
      inflationComposition: {
        foodEnergy: this.extractStructuredSection(content, 'Food and energy price contributions') || 'Food/energy analysis',
        housing: this.extractStructuredSection(content, 'Housing and shelter costs') || 'Housing analysis',
        servicesVsGoods: this.extractStructuredSection(content, 'Services vs goods inflation') || 'Services/goods analysis',
        durableVsNonDurable: this.extractStructuredSection(content, 'Durable vs non-durable goods') || 'Durables analysis',
        regionalVariations: this.extractStructuredSection(content, 'Regional and demographic variations') || 'Regional analysis'
      },
      inflationDrivers: {
        supplyChain: this.extractStructuredSection(content, 'Supply chain and logistics factors') || 'Supply chain analysis',
        laborMarket: this.extractStructuredSection(content, 'Labor market tightness') || 'Labor market analysis',
        monetaryPolicy: this.extractStructuredSection(content, 'Monetary policy and money supply') || 'Monetary policy impact',
        fiscalPolicy: this.extractStructuredSection(content, 'Fiscal policy and government spending') || 'Fiscal policy impact',
        exchangeRate: this.extractStructuredSection(content, 'Exchange rate and import price effects') || 'Exchange rate effects'
      },
      inflationExpectations: {
        shortVsLongTerm: this.extractStructuredSection(content, 'Short-term vs long-term expectations') || 'Term structure analysis',
        marketBased: this.extractStructuredSection(content, 'Market-based measures') || 'Market-based expectations',
        surveyBased: this.extractStructuredSection(content, 'Survey-based measures') || 'Survey expectations',
        centralBankCredibility: this.extractStructuredSection(content, 'Central bank credibility') || 'Credibility assessment',
        anchoringEffectiveness: this.extractStructuredSection(content, 'Anchoring effectiveness') || 'Anchoring analysis'
      },
      historicalContext: {
        inflationCycles: this.extractStructuredSection(content, 'Inflation cycles and patterns') || 'Cycle analysis',
        pastEpisodes: this.extractStructuredSection(content, 'Comparison to past episodes') || 'Historical comparison',
        secularTrends: this.extractStructuredSection(content, 'Secular trends and structural changes') || 'Structural analysis',
        internationalComparisons: this.extractStructuredSection(content, 'International comparisons') || 'International analysis',
        regimeChanges: this.extractStructuredSection(content, 'Regime changes and policy shifts') || 'Regime analysis'
      },
      transmissionMechanisms: {
        wagePriceSpiral: this.extractStructuredSection(content, 'Wage-price spiral dynamics') || 'Wage-price analysis',
        costPassThrough: this.extractStructuredSection(content, 'Pass-through from costs to prices') || 'Pass-through analysis',
        monetaryTransmission: this.extractStructuredSection(content, 'Monetary policy transmission') || 'Monetary transmission',
        exchangeRatePassThrough: this.extractStructuredSection(content, 'Exchange rate pass-through') || 'Exchange rate transmission',
        expectationFormation: this.extractStructuredSection(content, 'Expectation formation processes') || 'Expectation formation'
      },
      sectoralAnalysis: {
        housing: this.extractStructuredSection(content, 'Housing and real estate inflation') || 'Housing inflation',
        healthcare: this.extractStructuredSection(content, 'Healthcare and education costs') || 'Healthcare inflation',
        transportation: this.extractStructuredSection(content, 'Transportation and energy') || 'Transportation inflation',
        food: this.extractStructuredSection(content, 'Food and commodity prices') || 'Food inflation',
        technology: this.extractStructuredSection(content, 'Technology and digital services') || 'Technology inflation'
      },
      policyResponse: {
        centralBankReaction: this.extractStructuredSection(content, 'Central bank policy reactions') || 'Central bank response',
        fiscalConsiderations: this.extractStructuredSection(content, 'Fiscal policy considerations') || 'Fiscal response',
        structuralReforms: this.extractStructuredSection(content, 'Structural reform measures') || 'Reform measures',
        internationalCoordination: this.extractStructuredSection(content, 'International coordination') || 'International coordination',
        communicationStrategies: this.extractStructuredSection(content, 'Communication strategies') || 'Communication analysis'
      },
      inflationOutlook: {
        shortTermAssessment: this.extractStructuredSection(content, 'Short-term inflation assessments') || 'Short-term outlook',
        mediumTermPath: this.extractStructuredSection(content, 'Medium-term inflation path') || 'Medium-term path',
        longTermAnchoring: this.extractStructuredSection(content, 'Long-term inflation anchoring') || 'Long-term anchoring',
        riskFactors: this.extractBulletPoints(content, 'Risk factors and scenarios'),
        policyEffectiveness: this.extractStructuredSection(content, 'Policy effectiveness assessment') || 'Policy effectiveness'
      },
      keyMetrics: {
        currentInflation: this.extractNumericValue(content, 'current inflation', 3.0),
        coreInflation: this.extractNumericValue(content, 'core inflation', 2.5),
        expectedInflation: this.extractNumericValue(content, 'expected inflation', 2.8),
        targetInflation: this.extractNumericValue(content, 'target', 2.0)
      },
      assessments: {
        nextQuarter: this.extractNumericValue(content, 'next quarter', 2.8),
        nextYear: this.extractNumericValue(content, 'next year', 2.5),
        confidenceInterval: this.extractStructuredSection(content, 'confidence interval') || '±0.3%'
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