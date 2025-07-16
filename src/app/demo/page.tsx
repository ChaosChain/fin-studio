'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PaymentDialog } from '@/components/PaymentDialog';
import { X402PaymentRequirements } from '@/types/payment';
import { Coins, TrendingUp, BarChart3, Globe, DollarSign, CheckCircle } from 'lucide-react';

export default function PaymentDemoPage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [paymentRequirements, setPaymentRequirements] = useState<X402PaymentRequirements | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ [key: string]: boolean }>({});

  const agents = [
    {
      id: 'market-research-agent',
      name: 'Market Research Agent',
      description: 'Analyzes market trends and news sentiment',
      price: 0.01,
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      id: 'macro-research-agent',
      name: 'Macro Research Agent',
      description: 'Monitors economic indicators and central bank policies',
      price: 0.02,
      icon: Globe,
      color: 'bg-green-500'
    },
    {
      id: 'price-analysis-agent',
      name: 'Price Analysis Agent',
      description: 'Performs technical analysis and identifies trading signals',
      price: 0.005,
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      id: 'insights-agent',
      name: 'Insights Agent',
      description: 'Coordinates agents and generates personalized analysis',
      price: 0.03,
      icon: Coins,
      color: 'bg-orange-500'
    }
  ];

  const handlePayForAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const requirements: X402PaymentRequirements = {
      scheme: 'exact',
      network: 'base-sepolia',
      maxAmountRequired: (agent.price * 1000000).toString(), // Convert to USDC wei
      resource: `/agents/${agentId}`,
      description: agent.description,
      mimeType: 'application/json',
      payTo: '0x0000000000000000000000000000000000000000',
      maxTimeoutSeconds: 300,
      asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
      extra: {
        name: 'USD Coin',
        version: '2'
      }
    };

    setSelectedAgent(agentId);
    setPaymentRequirements(requirements);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (txHash: string) => {
    console.log('Payment successful:', txHash);
    setPaymentStatus(prev => ({ ...prev, [selectedAgent]: true }));
    setIsPaymentOpen(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Integration Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of x402 micropayments with Base's commerce-payments escrow system. 
            Pay for AI agent services with USDC on Base Sepolia.
          </p>
        </div>

        {/* Protocol Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                x402 Protocol
              </CardTitle>
              <CardDescription>
                HTTP-native micropayment protocol for agent requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Network:</span>
                  <Badge variant="outline">Base Sepolia</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Token:</span>
                  <Badge variant="outline">USDC</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Settlement:</span>
                  <Badge variant="outline">~2 seconds</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Commerce Payments
              </CardTitle>
              <CardDescription>
                Secure escrow system for payment handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <Badge variant="outline">Authorize & Capture</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contract:</span>
                  <Badge variant="outline">Audited</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Protection:</span>
                  <Badge variant="outline">Escrow</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isPaid = paymentStatus[agent.id];
            
            return (
              <Card key={agent.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`absolute top-0 left-0 w-1 h-full ${agent.color}`} />
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agent.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isPaid && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Price per request:</span>
                      <Badge variant="secondary" className="text-lg font-bold">
                        ${agent.price.toFixed(3)} USDC
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span>Base Sepolia</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement:</span>
                        <span>Instant</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={isPaid ? 'text-green-600' : 'text-orange-600'}>
                          {isPaid ? 'Paid' : 'Payment Required'}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handlePayForAgent(agent.id)}
                      className="w-full"
                      disabled={isPaid}
                    >
                      {isPaid ? 'Already Paid' : `Pay $${agent.price.toFixed(3)} USDC`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Instructions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Demo Instructions</CardTitle>
            <CardDescription>
              How to test the payment integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Connect Your Wallet</h4>
                  <p className="text-sm text-gray-600">
                    Make sure you have a wallet connected to Base Sepolia testnet
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Get Test USDC</h4>
                  <p className="text-sm text-gray-600">
                    Get Base Sepolia USDC from a faucet or bridge from Ethereum Sepolia
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Test Payment Flow</h4>
                  <p className="text-sm text-gray-600">
                    Click "Pay" on any agent card to test the payment integration
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Development Mode</h4>
                  <p className="text-sm text-gray-600">
                    In development mode, payments are simulated - no real transactions are made
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      {paymentRequirements && (
        <PaymentDialog
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          paymentRequirements={paymentRequirements}
          agentName={agents.find(a => a.id === selectedAgent)?.name || 'AI Agent'}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
} 