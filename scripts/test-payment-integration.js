/**
 * Test script for payment integration
 * Tests the payment distribution API endpoint with generated agent wallets
 */

const test_payment_api = async () => {
  const baseUrl = 'http://localhost:3000';
  const testData = {
    taskId: 'task_test_' + Date.now(),
    userAddress: '0x1234567890123456789012345678901234567890',
    amount: 1, // 1 USDC
    initialTxHash: '0x' + Math.random().toString(16).substring(2, 66), // Mock initial transaction
    multipleTransactions: true
  };

  console.log('🧪 Testing Payment Integration API');
  console.log('Test Data:', testData);

  try {
    // Test POST endpoint - process payment
    console.log('\n📤 Testing POST /api/payment/report-access');
    const postResponse = await fetch(`${baseUrl}/api/payment/report-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!postResponse.ok) {
      throw new Error(`POST request failed: ${postResponse.status} ${postResponse.statusText}`);
    }

    const postData = await postResponse.json();
    console.log('✅ POST Response:', JSON.stringify(postData, null, 2));

    // Test GET endpoint - check payment status
    console.log('\n📥 Testing GET /api/payment/report-access');
    const getResponse = await fetch(`${baseUrl}/api/payment/report-access?taskId=${testData.taskId}`);

    if (!getResponse.ok) {
      throw new Error(`GET request failed: ${getResponse.status} ${getResponse.statusText}`);
    }

    const getData = await getResponse.json();
    console.log('✅ GET Response:', JSON.stringify(getData, null, 2));

    console.log('\n🎉 Payment Integration Test Complete!');
    console.log('\n📊 Test Results Summary:');
    console.log(`- Payment ID: ${postData.paymentId}`);
    console.log(`- Agents Involved: ${postData.payment?.distribution?.length || 0}`);
    console.log(`- Total Distribution: $${postData.payment?.totalAmount || 0}`);
    console.log(`- Development Mode: ${postData.developmentMode}`);
    console.log(`- Payment Method: ${postData.payment?.paymentMethod || 'N/A'}`);
    
    console.log('\n💳 Multiple Transaction Verification:');
    console.log(`- Agent Transactions: ${postData.payment?.transactionCount || 0}`);
    console.log(`- Each Agent Gets Own TX: ${postData.payment?.distribution?.every(d => d.transaction) ? '✅' : '❌'}`);
    console.log(`- Multiple Transaction Method: ${postData.payment?.paymentMethod === 'multiple_agent_transactions' ? '✅' : '❌'}`);
    console.log(`- Initial Transaction: ${postData.payment?.initialTransaction ? '✅' : '❌'}`);
    console.log(`- Platform Fee Accounted For: ${postData.payment?.platformFee ? '✅' : '❌'}`);
    
    // Verify transaction amounts
    const distributionTotal = postData.payment?.distribution?.reduce((sum, d) => sum + d.amount, 0) || 0;
    console.log(`\n🔍 Multiple Transaction Details:`);
    console.log(`- Total Agent Count: ${postData.payment?.totalAgents || 0}`);
    console.log(`- Total TX Count: ${postData.payment?.transactionCount || 0}`);
    console.log(`- Initial TX: ${postData.payment?.initialTransaction?.substring(0, 20)}...`);
    console.log(`- Total Sent to Agents: $${distributionTotal.toFixed(6)}`);
    console.log(`- Expected Agent Payments: $0.950000`);
    console.log(`- Platform Fee (5%): $${postData.payment?.platformFee?.amount?.toFixed(6) || '0.000000'}`);
    console.log(`- Math Check: ${Math.abs(distributionTotal - 0.95) < 0.000001 ? '✅ Correct' : '❌ Incorrect'}`);
    
    // Show sample on-chain transactions to specific agent addresses
    console.log(`\n📋 On-Chain Transactions to Agent Addresses:`);
    postData.payment?.distribution?.slice(0, 4).forEach((dist, i) => {
      console.log(`TX ${i + 1}: User → ${dist.agentId} ($${dist.amount.toFixed(6)})`);
      console.log(`       Address: ${dist.walletAddress}`);
      console.log(`       TX Hash: ${dist.transaction}\n`);
    });
    if (postData.payment?.distribution?.length > 4) {
      console.log(`... and ${postData.payment.distribution.length - 4} more on-chain transactions to agent addresses`);
    }

    return true;

  } catch (error) {
    console.error('❌ Payment Integration Test Failed:', error.message);
    return false;
  }
};

// Run test if called directly
if (require.main === module) {
  test_payment_api()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { test_payment_api }; 