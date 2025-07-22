/**
 * Fintech Types for Investment Analysis
 */

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
  source: string;
}

export interface TechnicalIndicators {
  symbol: string;
  indicators: {
    sma?: number[];
    ema?: number[];
    rsi?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
    stochastic?: {
      k: number;
      d: number;
    };
  };
  timestamp: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment?: Sentiment;
  relevantSymbols?: string[];
  impact?: MarketImpact;
}

export enum Sentiment {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

export enum MarketImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface EconomicIndicator {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  releaseDate: Date;
  frequency: string;
  importance: MarketImpact;
  country: string;
  category: EconomicCategory;
}

export enum EconomicCategory {
  GDP = 'gdp',
  INFLATION = 'inflation',
  EMPLOYMENT = 'employment',
  INTEREST_RATES = 'interest_rates',
  MANUFACTURING = 'manufacturing',
  CONSUMER_SPENDING = 'consumer_spending',
  TRADE = 'trade',
  HOUSING = 'housing'
}

export interface MarketAnalysis {
  id: string;
  symbol?: string;
  sector?: string;
  analysisType: AnalysisType;
  summary: string;
  details: string;
  confidence: number;
  recommendation: Recommendation;
  targetPrice?: number;
  timeHorizon?: string;
  risks: string[];
  opportunities: string[];
  keyMetrics: Record<string, number>;
  generatedAt: Date;
  generatedBy: string;
}

export enum AnalysisType {
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  SENTIMENT = 'sentiment',
  MACRO = 'macro',
  QUANTITATIVE = 'quantitative'
}

export enum Recommendation {
  POSITIVE = 'positive',
  NEGATIVE = 'negative', 
  NEUTRAL = 'neutral'
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  lastUpdated: Date;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  weight: number;
}

export interface DailyInsight {
  id: string;
  date: Date;
  title: string;
  summary: string;
  sections: InsightSection[];
  keyPoints: string[];
  marketSentiment: Sentiment;
  actionItems: string[];
  generatedBy: string[];
  deliveryMethod: DeliveryMethod;
}

export interface InsightSection {
  title: string;
  content: string;
  type: SectionType;
  data?: any;
  charts?: ChartData[];
}

export enum SectionType {
  MARKET_OVERVIEW = 'market_overview',
  TECHNICAL_ANALYSIS = 'technical_analysis',
  NEWS_SUMMARY = 'news_summary',
  ECONOMIC_EVENTS = 'economic_events',
  PORTFOLIO_UPDATE = 'portfolio_update',
  RECOMMENDATIONS = 'recommendations'
}

export enum DeliveryMethod {
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
  SMS = 'sms'
}

export interface ChartData {
  type: ChartType;
  title: string;
  data: any[];
  config?: Record<string, any>;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  CANDLESTICK = 'candlestick',
  AREA = 'area',
  SCATTER = 'scatter'
}

export interface ResearchRequest {
  id: string;
  type: ResearchType;
  symbol?: string;
  sector?: string;
  keywords?: string[];
  timeframe?: TimeFrame;
  priority: Priority;
  requestedBy: string;
  requestedAt: Date;
  status: RequestStatus;
  results?: any;
  completedAt?: Date;
}

export enum ResearchType {
  STOCK_ANALYSIS = 'stock_analysis',
  SECTOR_ANALYSIS = 'sector_analysis',
  MACRO_ANALYSIS = 'macro_analysis',
  NEWS_RESEARCH = 'news_research',
  TECHNICAL_ANALYSIS = 'technical_analysis'
}

export enum TimeFrame {
  INTRADAY = 'intraday',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum RequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  input: any;
  output?: any;
  status: RequestStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
} 