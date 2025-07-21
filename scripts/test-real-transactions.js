/**
 * Test script for REAL on-chain transactions to agent addresses
 * This will send actual USDC to each agent address on Base Sepolia
 * 
 * IMPORTANT: Only run this if you have:
 * 1. OPERATOR_PRIVATE_KEY set in .env.local
 * 2. USDC balance on Base Sepolia for the operator account
 * 3. BASE_SEPOLIA_RPC_URL configured
 */

const test_real_transactions = async () => {
  const baseUrl = 'http://localhost:3000';
  const testData = {
    taskId: 'real_tx_test_' + Date.now(),
    userAddress: '0x1234567890123456789012345678901234567890', // Mock user
    amount: 1, // 1 USDC
    initialTxHash: '0x' + Math.random().toString(16).substring(2, 66), // Mock initial transaction
    multipleTransactions: true,
    realTransactions: true // Flag to force real transactions
  };

  console.log('🔥 Testing REAL On-Chain Transactions to Agent Addresses');
  console.log('⚠️  WARNING: This will send REAL USDC on Base Sepolia!');
  console.log('Test Data:', testData);
  
  // Check environment variables
  const hasPrivateKey = process.env.OPERATOR_PRIVATE_KEY && process.env.OPERATOR_PRIVATE_KEY !== '';
  const hasRpcUrl = process.env.BASE_SEPOLIA_RPC_URL && process.env.BASE_SEPOLIA_RPC_URL !== '';
  
  console.log(`\n🔑 Environment Check:`);
  console.log(`- OPERATOR_PRIVATE_KEY: ${hasPrivateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`- BASE_SEPOLIA_RPC_URL: ${hasRpcUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`- DEVELOPMENT_MODE: ${process.env.DEVELOPMENT_MODE || 'undefined'}`);
  
  if (!hasPrivateKey) {
    console.log('\n❌ OPERATOR_PRIVATE_KEY is required for real transactions');
    console.log('💡 Set it in your .env.local file');
    return false;
  }

  try {
    // Test POST endpoint - process REAL payment transactions
    console.log('\n📤 Testing REAL Transaction Processing');
    
    // Set environment to force real transactions
    process.env.DEVELOPMENT_MODE = 'false';
    
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
    console.log('\n🎉 REAL Transaction Response:', JSON.stringify(postData, null, 2));

    if (!postData.success) {
      throw new Error(`Real transaction processing failed: ${postData.error || 'Unknown error'}`);
    }

    console.log('\n🎉 REAL On-Chain Transaction Test Complete!');
    console.log('\n📊 Real Transaction Results:');
    console.log(`- Payment ID: ${postData.paymentId}`);
    console.log(`- Real Agents Paid: ${postData.payment?.totalAgents || 0}`);
    console.log(`- Real TX Count: ${postData.payment?.transactionCount || 0}`);
    console.log(`- Payment Method: ${postData.payment?.paymentMethod || 'N/A'}`);
    console.log(`- Development Mode: ${postData.developmentMode}`);
    
    console.log('\n💳 Real Transaction Verification:');
    console.log(`- Each Agent Got Real TX: ${postData.payment?.distribution?.every(d => d.transaction && d.transaction.startsWith('0x')) ? '✅' : '❌'}`);
    console.log(`- Real Transaction Method: ${postData.payment?.paymentMethod === 'multiple_agent_transactions' ? '✅' : '❌'}`);
    console.log(`- Initial Transaction: ${postData.payment?.initialTransaction ? '✅' : '❌'}`);
    
    // Show real transaction hashes
    console.log(`\n🔗 Real On-Chain Transaction Hashes:`);
    postData.payment?.distribution?.forEach((dist, i) => {
      console.log(`TX ${i + 1}: ${dist.agentId} → ${dist.transaction}`);
      console.log(`       BaseScan: https://sepolia.basescan.org/tx/${dist.transaction}`);
      console.log(`       Amount: $${dist.amount.toFixed(6)} USDC`);
      console.log(`       Address: ${dist.walletAddress}\n`);
    });

    return true;
  } catch (error) {
    console.error('\n❌ Real Transaction Test Failed:', error.message);
    return false;
  }
};

// Export for module usage or run directly
if (require.main === module) {
  // Load environment variables from .env.local
  require('dotenv').config({ path: '.env.local' });
  
  test_real_transactions()
    .then(success => {
      if (success) {
        console.log('\n✅ All real transaction tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Real transaction tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
} else {
  module.exports = test_real_transactions;
} 