import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    console.log('🤖 Extracting stock/crypto intent from:', message);

    // Create a specialized prompt for extracting investment analysis intent
    const systemPrompt = `You are a financial analysis assistant. Your job is to extract stock/crypto symbols and analysis intent from user messages.

TASK:
1. Extract all mentioned stock symbols (e.g., AAPL, TSLA, GOOGL) and crypto symbols (e.g., BTC, ETH, ADA)
2. Determine the analysis intent (analyze, research, evaluate, compare, examine, study, etc.)
3. Identify the analysis type requested (technical analysis, sentiment analysis, comprehensive analysis, etc.)

RULES:
- Always return valid JSON
- Stock symbols should be uppercase (AAPL not Apple)
- Map company names to symbols (Apple → AAPL, Tesla → TSLA, Microsoft → MSFT, etc.)
- Map crypto names to symbols (Bitcoin → BTC, Ethereum → ETH, etc.)
- ONLY extract symbols that are explicitly mentioned - NO fallback suggestions
- If no symbols found, return empty symbols array
- Default to comprehensive analysis if not specified
- Focus on ANALYSIS, not prediction - avoid words like "predict", "forecast", "future", "will be"
- Use analysis terms: "analyze", "examine", "study", "review", "assess", "evaluate"

RESPONSE FORMAT:
{
  "symbols": ["AAPL", "TSLA"],
  "intent": "analyze",
  "analysisType": "comprehensive",
  "confidence": 0.95,
  "reasoning": "User wants to analyze Apple and Tesla stocks",
  "userFriendlyResponse": "I'll help you analyze Apple (AAPL) and Tesla (TSLA) with a comprehensive analysis."
}

EXAMPLES:
- "analyze Bitcoin" → symbols: ["BTC"]
- "help me research Apple and Google stocks" → symbols: ["AAPL", "GOOGL"] 
- "what's the technical analysis for TSLA?" → symbols: ["TSLA"], analysisType: "technical"
- "compare Microsoft vs Apple" → symbols: ["MSFT", "AAPL"], intent: "compare"
- "tell me about crypto" → symbols: [] (no specific symbols mentioned)`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json({ 
        error: 'Failed to extract stock intent',
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    try {
      const parsedResult = JSON.parse(content);
      
      // Validate the response structure
      if (!parsedResult.symbols || !Array.isArray(parsedResult.symbols)) {
        throw new Error('Invalid response structure: symbols array required');
      }

      // Clean up symbols (uppercase, remove duplicates, validate)
      const validSymbols = [...new Set(
        parsedResult.symbols
          .map((s: string) => s.toUpperCase().trim())
          .filter((s: string) => s.match(/^[A-Z]{2,5}$/)) // Basic symbol validation
      )];

      if (validSymbols.length === 0) {
        // No fallback symbols - user must specify what they want analyzed
        console.log('No valid symbols extracted from user message');
        return NextResponse.json({
          symbols: [],
          intent: 'analyze',
          analysisType: 'comprehensive',
          confidence: 0.0,
          reasoning: 'No specific symbols mentioned in user request',
          userFriendlyResponse: "Please specify which stocks or cryptocurrencies you'd like me to analyze. For example, 'analyze Apple stock' or 'examine Bitcoin'.",
          error: true
        });
      }

      console.log('✅ Extracted symbols:', validSymbols);
      console.log('📊 Analysis intent:', parsedResult.intent || 'analyze');

      // Clean the response to ensure no prediction language
      const cleanUserResponse = parsedResult.userFriendlyResponse
        ?.replace(/predict|forecast|future|will be|going to/gi, 'analyze')
        || `I'll analyze ${validSymbols.join(', ')} for you.`;

      return NextResponse.json({
        symbols: validSymbols,
        intent: parsedResult.intent || 'analyze',
        analysisType: parsedResult.analysisType || 'comprehensive',
        confidence: parsedResult.confidence || 0.8,
        reasoning: parsedResult.reasoning || 'Extracted from user message',
        userFriendlyResponse: cleanUserResponse,
        fallback: false
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', content);
      
      // Fallback to basic symbol extraction using regex - but no default symbols
      const symbolMatches = message.toUpperCase().match(/\b[A-Z]{2,5}\b/g);
      const extractedSymbols = symbolMatches ? [...new Set(symbolMatches)] : [];

      if (extractedSymbols.length === 0) {
        return NextResponse.json({
          symbols: [],
          intent: 'analyze',
          analysisType: 'comprehensive',
          confidence: 0.0,
          reasoning: 'Could not extract any symbols from user message',
          userFriendlyResponse: "I couldn't identify specific stocks or cryptocurrencies to analyze. Please mention the symbols you'd like me to examine, such as 'AAPL', 'Bitcoin', or 'Tesla stock'.",
          error: true
        });
      }

      return NextResponse.json({
        symbols: extractedSymbols,
        intent: 'analyze',
        analysisType: 'comprehensive',
        confidence: 0.6,
        reasoning: 'Extracted using fallback regex method',
        userFriendlyResponse: `I'll analyze ${extractedSymbols.join(', ')} for you.`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Stock intent extraction error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 