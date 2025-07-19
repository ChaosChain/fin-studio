import { NextRequest, NextResponse } from 'next/server';
import { marketDataService } from '@/lib/market-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    console.log(`API: Fetching market data for symbols: ${symbols.join(', ')}`);

    const marketData = await marketDataService.getBatchMarketData(symbols);

    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      count: marketData.length
    });

  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    console.log(`API: Fetching market data for symbols: ${symbols.join(', ')}`);

    const marketData = await marketDataService.getBatchMarketData(symbols);

    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      count: marketData.length
    });

  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 