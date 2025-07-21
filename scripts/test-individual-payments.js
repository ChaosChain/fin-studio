/**
 * Test script for individual agent payments
 * Simulates the sequential payment flow to each agent address
 */

const test_individual_payments = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🎯 Testing Individual Agent Payments');
  console.log('This simulates paying each agent individually with their distributed amounts\n');

  try {
    // Step 1: Simulate agent configuration (normally this would be from the system)
    console.log('📋 Step 1: Setting up test agent configuration...');
    
    const mockAgentWallets = [
      { agentId: 'market-research-agent', walletAddress: '0x6d0863396750A35d0E298f2385B8C2e54C2aAD30' },
      { agentId: 'macro-research-agent', walletAddress: '0xB88e526D49e235A00ED839E5Fb16AF822d63d2C8' },
      { agentId: 'price-analysis-agent', walletAddress: '0x7b0b5868D793765e8dE3B89b4D77ba767d86E20b' },
      { agentId: 'insights-agent', walletAddress: '0xdA1F0F6bc6bF3616FB8EA91B2B20e05eFA89334A' },
      { agentId: 'verifier-agent-1', walletAddress: '0xcBDAF24974eC98a079A6Ab34200a328ECA08CdDc' },
      { agentId: 'verifier-agent-2', walletAddress: '0xe68146088585bF7e01b67F4bE4FF2FdF05f8704E' },
      { agentId: 'verifier-agent-3', walletAddress: '0x29f0723F0ffe0F46433b05957a4Ebf7F6F65cbEa' },
      { agentId: 'verifier-agent-4', walletAddress: '0x147bb92E997F873652Aa67523496fcc0E353DbC2' }
    ];

    console.log(`✅ Using ${mockAgentWallets.length} test agent wallets`);

    // Step 2: Calculate distribution
    console.log('\n💰 Step 2: Calculating payment distribution...');
    const workerAgents = mockAgentWallets.filter(w => !w.agentId.includes('verifier'));
    const verifierAgents = mockAgentWallets.filter(w => w.agentId.includes('verifier'));

    const distribution = [];
    
    // Worker agents get 17.5% each
    for (const agent of workerAgents) {
      distribution.push({
        agentId: agent.agentId,
        walletAddress: agent.walletAddress,
        amount: 0.175,
        percentage: 0.175
      });
    }
    
    // Verifier agents get 6.25% each  
    for (const agent of verifierAgents) {
      distribution.push({
        agentId: agent.agentId,
        walletAddress: agent.walletAddress,
        amount: 0.0625,
        percentage: 0.0625
      });
    }

    console.log(`📊 Distribution calculated:`);
    console.log(`- Worker agents: ${workerAgents.length} x 17.5% = ${workerAgents.length * 17.5}%`);
    console.log(`- Verifier agents: ${verifierAgents.length} x 6.25% = ${verifierAgents.length * 6.25}%`);
    console.log(`- Platform fee: 5%`);
    console.log(`- Total agents: ${distribution.length}`);

    // Step 3: Simulate individual payments
    console.log('\n💳 Step 3: Simulating individual payments...');
    const completedPayments = [];
    
    for (let i = 0; i < distribution.length; i++) {
      const agent = distribution[i];
      const txHash = '0x' + Math.random().toString(16).substring(2, 66); // Mock transaction hash
      
      const payment = {
        ...agent,
        txHash: txHash,
        timestamp: new Date().toISOString()
      };
      
      completedPayments.push(payment);
      
      console.log(`Payment ${i + 1}/${distribution.length}: ${agent.agentId}`);
      console.log(`  💸 Amount: $${agent.amount} USDC (${(agent.percentage * 100).toFixed(2)}%)`);
      console.log(`  🎯 To: ${agent.walletAddress}`);
      console.log(`  📝 TX: ${txHash.substring(0, 12)}...`);
      console.log(`  ✅ Status: Individual x402 transaction completed\n`);
    }

    // Step 4: Submit completion to API
    console.log('📤 Step 4: Submitting payment completion to API...');
    const testData = {
      taskId: 'individual_test_' + Date.now(),
      userAddress: '0x1234567890123456789012345678901234567890',
      amount: 1,
      individualTransactions: true,
      completedPayments: completedPayments
    };

    const postResponse = await fetch(`${baseUrl}/api/payment/report-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!postResponse.ok) {
      throw new Error(`POST request failed: ${postResponse.status}`);
    }

    const postData = await postResponse.json();
    
    if (!postData.success) {
      throw new Error(`API processing failed: ${postData.error}`);
    }

    console.log('✅ API Response received');

    // Step 5: Verify results
    console.log('\n🔍 Step 5: Verifying results...');
    const payment = postData.payment;
    
    console.log(`📊 Final Results:`);
    console.log(`- Payment Method: ${payment.paymentMethod}`);
    console.log(`- Total Agents Paid: ${payment.totalAgents}`);
    console.log(`- Transaction Count: ${payment.transactionCount}`);
    console.log(`- Total Distributed: $${payment.totalDistributed.toFixed(6)}`);
    console.log(`- Platform Fee: $${payment.platformFee.amount.toFixed(6)}`);
    
    // Verify each agent got paid correctly
    console.log(`\n✅ Individual Payment Verification:`);
    payment.distribution.forEach((dist, i) => {
      const expectedAmount = dist.agentId.includes('verifier') ? 0.0625 : 0.175;
      const isCorrect = Math.abs(dist.amount - expectedAmount) < 0.000001;
      console.log(`${i + 1}. ${dist.agentId}: $${dist.amount.toFixed(6)} ${isCorrect ? '✅' : '❌'}`);
    });

    // Math verification
    const totalExpected = 0.95; // 95% of 1 USDC
    const totalActual = payment.totalDistributed;
    const mathCorrect = Math.abs(totalActual - totalExpected) < 0.000001;
    
    console.log(`\n🔢 Math Verification:`);
    console.log(`- Expected total: $${totalExpected.toFixed(6)}`);
    console.log(`- Actual total: $${totalActual.toFixed(6)}`);
    console.log(`- Math check: ${mathCorrect ? '✅ Correct' : '❌ Incorrect'}`);

    console.log(`\n🎉 Individual Agent Payment Test Complete!`);
    return mathCorrect && payment.transactionCount === distribution.length;

  } catch (error) {
    console.error('\n❌ Individual Payment Test Failed:', error.message);
    return false;
  }
};

// Export for module usage or run directly
if (require.main === module) {
  test_individual_payments()
    .then(success => {
      if (success) {
        console.log('\n✅ All individual payment tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Individual payment tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
} else {
  module.exports = test_individual_payments;
} 