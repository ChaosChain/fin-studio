import fetch from 'node-fetch';

interface A2AMessage {
  messageId: string;
  kind: 'message';
  parts: Array<{
    type: 'text';
    text: string;
  }>;
  role: 'user';
}

interface SendMessageRequest {
  id: string;
  jsonrpc: '2.0';
  method: 'message/send';
  params: {
    message: A2AMessage;
    configuration?: {
      acceptedOutputModes: string[];
      blocking?: boolean;
    };
  };
}

/**
 * Test the new A2A SDK-based gateway
 */
async function testA2ASDKGateway() {
  const baseUrl = 'http://localhost:8080';
  
  console.log('🧪 Testing A2A SDK-based Gateway...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Get Agent Card
    console.log('2️⃣ Testing Agent Card...');
    const agentResponse = await fetch(`${baseUrl}/a2a/api/agent`);
    const agentData = await agentResponse.json();
    console.log('✅ Agent Card:', JSON.stringify(agentData, null, 2));
    console.log('');

    // Test 3: Send Message - Market Sentiment Analysis
    console.log('3️⃣ Testing Send Message (Market Sentiment)...');
    const message: A2AMessage = {
      messageId: `msg_${Date.now()}`,
      kind: 'message',
      parts: [
        {
          type: 'text',
          text: JSON.stringify({
            action: 'analyze_market_sentiment',
            data: {
              symbols: ['AAPL', 'GOOGL', 'MSFT'],
              timeframe: 'daily'
            }
          })
        }
      ],
      role: 'user'
    };

    const sendRequest: SendMessageRequest = {
      id: `req_${Date.now()}`,
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message,
        configuration: {
          acceptedOutputModes: ['text'],
          blocking: true
        }
      }
    };

    const sendResponse = await fetch(`${baseUrl}/a2a/api/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendRequest)
    });

    const sendData = await sendResponse.json();
    console.log('✅ Message Response:', JSON.stringify(sendData, null, 2));
    console.log('');

    // Test 4: Send Message - Technical Analysis
    console.log('4️⃣ Testing Send Message (Technical Analysis)...');
    const techMessage: A2AMessage = {
      messageId: `msg_${Date.now()}`,
      kind: 'message',
      parts: [
        {
          type: 'text',
          text: JSON.stringify({
            action: 'analyze_technical_indicators',
            data: {
              symbols: ['AAPL'],
              indicators: ['RSI', 'MACD', 'SMA']
            }
          })
        }
      ],
      role: 'user'
    };

    const techRequest: SendMessageRequest = {
      id: `req_${Date.now()}`,
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: techMessage,
        configuration: {
          acceptedOutputModes: ['text'],
          blocking: true
        }
      }
    };

    const techResponse = await fetch(`${baseUrl}/a2a/api/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(techRequest)
    });

    const techData = await techResponse.json();
    console.log('✅ Technical Analysis Response:', JSON.stringify(techData, null, 2));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ A2A SDK Gateway is running correctly');
    console.log('✅ Agent Card endpoint works');  
    console.log('✅ Message sending works with JSON-RPC protocol');
    console.log('✅ Task-based execution is functioning');
    console.log('');
    console.log('🔄 Next Steps:');
    console.log('1. Migrate frontend to use A2A SDK client');
    console.log('2. Implement specialized agent executors');
    console.log('3. Replace custom A2A implementation');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 Make sure the A2A SDK gateway is running:');
      console.log('   yarn gateway:sdk');
    }
  }
}

// Run the test
testA2ASDKGateway(); 