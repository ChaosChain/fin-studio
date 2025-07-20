#!/usr/bin/env ts-node

import { nostrAgentRelayNetwork } from '../src/lib/nostr-agent-relay-network';

async function testNostrARN() {
  console.log('🧪 Testing Nostr Agent Relay Network...\n');

  try {
    // Test 1: Network initialization
    console.log('📡 Test 1: Network Initialization');
    await nostrAgentRelayNetwork.start();
    console.log(`✅ Network started with public key: ${nostrAgentRelayNetwork.getPublicKey().slice(0, 16)}...`);
    console.log(`📡 Connected relays: ${nostrAgentRelayNetwork.getConnectedRelays().length}`);
    
    // Wait a moment for connections to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Agent announcement
    console.log('\n🤖 Test 2: Agent Announcement');
    const agentProfile = {
      agentId: 'test-agent-1',
      name: 'Test Financial Agent',
      capabilities: ['market_analysis', 'price_prediction'],
      specialties: ['crypto', 'stocks'],
      reputation: 95,
      cost: '0.001'
    };

    const announcementId = await nostrAgentRelayNetwork.announceAgent(agentProfile);
    console.log(`✅ Agent announced with event ID: ${announcementId.slice(0, 16)}...`);

    // Test 3: Agent discovery
    console.log('\n🔍 Test 3: Agent Discovery');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const discoveredAgents = await nostrAgentRelayNetwork.discoverAgents(['market_analysis']);
    console.log(`✅ Discovered ${discoveredAgents.length} agents with market_analysis capability`);

    // Test 4: Service request
    console.log('\n📤 Test 4: Service Request');
    const requestId = await nostrAgentRelayNetwork.requestAgentService({
      requestId: `test-req-${Date.now()}`,
      taskType: 'market_analysis',
      payload: { symbol: 'BTC', timeframe: '1h' },
      maxCost: '0.01'
    });
    console.log(`✅ Service request sent with ID: ${requestId.slice(0, 16)}...`);

    // Test 5: Network status
    console.log('\n📊 Test 5: Network Status');
    const status = nostrAgentRelayNetwork.getNetworkStatus();
    console.log(`✅ Network Status:`);
    console.log(`   - Running: ${status.isRunning}`);
    console.log(`   - Known Agents: ${status.knownAgents}`);
    console.log(`   - Connected Relays: ${status.connectedRelays}/${status.totalRelays}`);
    console.log(`   - Active Requests: ${status.activeRequests}`);
    console.log(`   - Subscriptions: ${status.subscriptions}`);

    // Test 6: Relay status
    console.log('\n🌐 Test 6: Relay Status');
    const relayStatus = nostrAgentRelayNetwork.getRelayStatus();
    console.log(`✅ Relay Status (${relayStatus.length} relays):`);
    relayStatus.forEach((relay, index) => {
      console.log(`   ${index + 1}. ${relay.url}`);
      console.log(`      - Connected: ${relay.connected}`);
      console.log(`      - Latency: ${relay.latency}ms`);
      console.log(`      - Subscriptions: ${relay.subscriptions}`);
    });

    // Wait for any pending events
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📈 Final Statistics:');
    const finalStatus = nostrAgentRelayNetwork.getNetworkStatus();
    console.log(`   - Total Events Published: ${finalStatus.knownAgents + finalStatus.activeRequests}`);
    console.log(`   - Network Uptime: ${Math.round(finalStatus.uptime / 1000)}s`);
    console.log(`   - Relay Success Rate: ${Math.round((finalStatus.connectedRelays / finalStatus.totalRelays) * 100)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await nostrAgentRelayNetwork.stop();
    console.log('✅ Network stopped');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await nostrAgentRelayNetwork.stop();
  process.exit(0);
});

// Run the test
testNostrARN().catch(console.error); 