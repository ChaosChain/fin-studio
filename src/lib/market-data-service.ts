import { MarketData } from '@/types/fintech';

interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

export class MarketDataService {
  private alphaVantageApiKey: string;
  private coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private alphaVantageBaseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  }

  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    const results: MarketData[] = [];
    
    for (const symbol of symbols) {
      try {
        let data: MarketData;
        
        if (this.isCrypto(symbol)) {
          data = await this.getCryptoData(symbol);
        } else {
          data = await this.getStockData(symbol);
        }
        
        results.push(data);
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        // Fallback to mock data if API fails
        results.push(this.getMockData(symbol));
      }
    }
    
    return results;
  }

  private isCrypto(symbol: string): boolean {
    const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'MATIC', 'AVAX', 'LINK'];
    return cryptoSymbols.includes(symbol.toUpperCase());
  }

  private async getStockData(symbol: string): Promise<MarketData> {
    const url = `${this.alphaVantageBaseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data: AlphaVantageResponse = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['01. symbol']) {
      throw new Error('Invalid response from Alpha Vantage');
    }
    
    return {
      symbol: quote['01. symbol'],
      name: this.getCompanyName(quote['01. symbol']),
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      timestamp: new Date(quote['07. latest trading day']),
      source: 'alpha-vantage'
    };
  }

  private async getCryptoData(symbol: string): Promise<MarketData> {
    const coinId = this.getCoinGeckoId(symbol);
    const url = `${this.coinGeckoBaseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const coinData = data[coinId];
    
    if (!coinData) {
      throw new Error('Invalid response from CoinGecko');
    }
    
    return {
      symbol: symbol.toUpperCase(),
      name: this.getCryptoName(symbol),
      price: coinData.usd,
      change: coinData.usd_24h_change || 0,
      changePercent: coinData.usd_24h_change_percentage || 0,
      volume: coinData.usd_24h_vol || 0,
      marketCap: coinData.usd_market_cap,
      timestamp: new Date(),
      source: 'coingecko'
    };
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink'
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms, Inc.',
      'AMZN': 'Amazon.com, Inc.',
      'NFLX': 'Netflix, Inc.',
      'AMD': 'Advanced Micro Devices, Inc.',
      'SPY': 'SPDR S&P 500 ETF Trust',
      'QQQ': 'Invesco QQQ Trust',
      'IWM': 'iShares Russell 2000 ETF'
    };
    return names[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  private getCryptoName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink'
    };
    return names[symbol.toUpperCase()] || symbol.toUpperCase();
  }

  private getMockData(symbol: string): MarketData {
    // Fallback mock data with realistic ranges
    let basePrice, priceRange, volumeRange;
    
    if (this.isCrypto(symbol)) {
      if (symbol === 'BTC') {
        basePrice = 45000;
        priceRange = 10000;
        volumeRange = 50000000;
      } else if (symbol === 'ETH') {
        basePrice = 2500;
        priceRange = 500;
        volumeRange = 30000000;
      } else {
        basePrice = 100;
        priceRange = 200;
        volumeRange = 10000000;
      }
    } else {
      basePrice = 150;
      priceRange = 200;
      volumeRange = 100000000;
    }

    const price = basePrice + Math.random() * priceRange;
    const change = (Math.random() - 0.5) * (this.isCrypto(symbol) ? price * 0.1 : 10);
    
    return {
      symbol: symbol.toUpperCase(),
      name: this.isCrypto(symbol) ? this.getCryptoName(symbol) : this.getCompanyName(symbol),
      price,
      change,
      changePercent: (change / price) * 100,
      volume: Math.floor(Math.random() * volumeRange),
      timestamp: new Date(),
      source: 'mock-fallback'
    };
  }

  // Method to get batch data efficiently
  async getBatchMarketData(symbols: string[]): Promise<MarketData[]> {
    const stockSymbols = symbols.filter(s => !this.isCrypto(s));
    const cryptoSymbols = symbols.filter(s => this.isCrypto(s));
    
    const promises: Promise<MarketData[]>[] = [];
    
    if (stockSymbols.length > 0) {
      promises.push(this.getBatchStockData(stockSymbols));
    }
    
    if (cryptoSymbols.length > 0) {
      promises.push(this.getBatchCryptoData(cryptoSymbols));
    }
    
    const results = await Promise.all(promises);
    return results.flat();
  }

  private async getBatchStockData(symbols: string[]): Promise<MarketData[]> {
    // For now, fetch individually - could optimize with batch endpoints
    const promises = symbols.map(symbol => this.getStockData(symbol));
    return Promise.all(promises);
  }

  private async getBatchCryptoData(symbols: string[]): Promise<MarketData[]> {
    try {
      const coinIds = symbols.map(s => this.getCoinGeckoId(s)).join(',');
      const url = `${this.coinGeckoBaseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko batch API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return symbols.map(symbol => {
        const coinId = this.getCoinGeckoId(symbol);
        const coinData = data[coinId];
        
        if (!coinData) {
          return this.getMockData(symbol);
        }
        
        return {
          symbol: symbol.toUpperCase(),
          name: this.getCryptoName(symbol),
          price: coinData.usd,
          change: coinData.usd_24h_change || 0,
          changePercent: coinData.usd_24h_change_percentage || 0,
          volume: coinData.usd_24h_vol || 0,
          marketCap: coinData.usd_market_cap,
          timestamp: new Date(),
          source: 'coingecko-batch'
        };
      });
    } catch (error) {
      console.error('Batch crypto data fetch failed:', error);
      return symbols.map(symbol => this.getMockData(symbol));
    }
  }
}

export const marketDataService = new MarketDataService(); 