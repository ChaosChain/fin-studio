'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  symbols?: string[];
  intent?: string;
  analysisType?: string;
}

interface StockIntent {
  symbols: string[];
  intent: string;
  analysisType: string;
  confidence: number;
  reasoning: string;
  userFriendlyResponse: string;
  fallback?: boolean;
  error?: boolean;
}

interface ChatInterfaceProps {
  onAnalysisRequest: (symbols: string[], intent: string, analysisType: string) => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

export function ChatInterface({ onAnalysisRequest, isAnalyzing = false, disabled = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '👋 Hi! I\'m your AI investment analysis assistant. Ask me to analyze any specific stock or cryptocurrency!',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (text: string, sender: 'user' | 'assistant', extra?: Partial<ChatMessage>) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      ...extra
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const extractStockIntent = async (message: string): Promise<StockIntent | null> => {
    try {
      const response = await fetch('/api/extract-stock-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        console.error('Stock intent extraction failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error extracting stock intent:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isExtracting || isAnalyzing || disabled) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message
    addMessage(userMessage, 'user');

    // Show typing indicator
    setIsTyping(true);
    setIsExtracting(true);

    try {
      // Extract stock intent from user message
      const stockIntent = await extractStockIntent(userMessage);

      if (!stockIntent) {
        setIsTyping(false);
        setIsExtracting(false);
        addMessage(
          "I'm sorry, I couldn't understand your request. Please try asking about specific stocks or cryptocurrencies, like 'analyze Apple stock' or 'examine Bitcoin'.",
          'assistant'
        );
        return;
      }

      // Check if no symbols were extracted (error case)
      if (stockIntent.error || stockIntent.symbols.length === 0) {
        setIsTyping(false);
        setIsExtracting(false);
        addMessage(
          stockIntent.userFriendlyResponse,
          'assistant'
        );
        return;
      }

      // Show assistant's interpretation
      setIsTyping(false);
      addMessage(
        stockIntent.userFriendlyResponse,
        'assistant',
        {
          symbols: stockIntent.symbols,
          intent: stockIntent.intent,
          analysisType: stockIntent.analysisType
        }
      );

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start analysis
      onAnalysisRequest(stockIntent.symbols, stockIntent.intent, stockIntent.analysisType);

    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      setIsExtracting(false);
      addMessage(
        "I encountered an error processing your request. Please try again or be more specific about which stocks or crypto you'd like me to analyze.",
        'assistant'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isExtracting || isAnalyzing || disabled) return;
    
    setInputText(prompt);
    // Small delay to show the input, then send
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const quickPrompts = [
    "Analyze Apple",
    "Analyze Bitcoin", 
    "Analyze NVDA",
    "Analyze Ethereum"
  ];

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardContent className="flex-1 flex flex-col p-4 space-y-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-sm' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
              }`}>
                <div>{message.text}</div>
                {message.symbols && (
                  <div className="text-xs mt-1 opacity-75">
                    📊 {message.symbols.join(', ')} | 🎯 {message.analysisType}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 max-w-[70%] px-3 py-2 rounded-lg rounded-bl-sm">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {isExtracting ? '🔍 Understanding your request...' : '💭 Thinking...'}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 2 && !isAnalyzing && (
          <div className="mb-4 px-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">💡 Try these examples:</div>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full transition-colors border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600"
                  disabled={isExtracting || isAnalyzing || disabled}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-auto">
          <div className="flex gap-3 items-end">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isAnalyzing 
                  ? "Analysis in progress..." 
                  : isExtracting 
                    ? "Processing your request..." 
                    : "Ask me to analyze stocks or crypto..."
              }
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500"
              disabled={isExtracting || isAnalyzing || disabled}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isExtracting || isAnalyzing || disabled}
              className="px-3 py-2 min-w-[44px] h-[36px] rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
              size="sm"
            >
              {isExtracting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '📤'
              )}
            </Button>
          </div>
          
          {/* Status Indicator */}
          {(isAnalyzing || isExtracting) && (
            <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              {isExtracting && '🔍 Understanding your request...'}
              {isAnalyzing && '🤖 AI agents are analyzing your request...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 