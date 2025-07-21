import { NextRequest, NextResponse } from 'next/server';
import { parseUnits } from 'viem';
import { agentWalletService } from '@/lib/agent-wallet-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      taskId, 
      userAddress, 
      amount = 1, // Default 1 USDC
      involvedAgents,
      workerAgents,
      verifierAgents,
      initialTxHash, // Hash from initial payment
      multipleTransactions = false, // Flag to process multiple transactions
      realTransactions = false, // Flag to force real on-chain transactions
      individualTransactions = false, // Flag for individual agent transactions
      completedPayments = [] // Array of completed individual payments
    } = await request.json();
    
    // Validate inputs
    if (!taskId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: taskId, userAddress' },
        { status: 400 }
      );
    }

    console.log(`💰 Processing report access payment for task ${taskId}`);
    console.log(`User: ${userAddress}, Amount: ${amount} USDC`);
    
    // Initialize agent wallets if not already done
    await agentWalletService.initializeStandardAgentWallets();

    // Default agents if not provided
    const defaultWorkerAgents = workerAgents || [
      'market-research-agent',
      'macro-research-agent', 
      'price-analysis-agent',
      'insights-agent'
    ];
    
    const defaultVerifierAgents = verifierAgents || [
      'verifier-agent-1',
      'verifier-agent-2',
      'verifier-agent-3',
      'verifier-agent-4'
    ];

    const allInvolvedAgents = involvedAgents || [...defaultWorkerAgents, ...defaultVerifierAgents];

    // Convert amount to wei (USDC has 6 decimals)
    const totalAmountWei = parseUnits(amount.toString(), 6);
    
    // Calculate payment distribution
    const distribution = agentWalletService.calculatePaymentDistribution(
      totalAmountWei,
      allInvolvedAgents,
      defaultWorkerAgents,
      defaultVerifierAgents
    );

    console.log(`📊 Payment Distribution Summary:`);
    console.log(`Total: ${amount} USDC`);
    console.log(`Worker Agents (70%): ${defaultWorkerAgents.length} agents`);
    console.log(`Verifier Agents (25%): ${defaultVerifierAgents.length} agents`);
    console.log(`Platform Fee (5%): Reserved`);

    // Check if we should use real transactions
    const shouldUseRealTransactions = realTransactions && process.env.OPERATOR_PRIVATE_KEY;
    const isDevelopmentMode = !shouldUseRealTransactions && (process.env.DEVELOPMENT_MODE === 'true' || !process.env.OPERATOR_PRIVATE_KEY);
    
    if (realTransactions) {
      console.log(`🔥 Real transaction mode requested!`);
      console.log(`🔑 Private key available: ${process.env.OPERATOR_PRIVATE_KEY ? '✅' : '❌'}`);
      console.log(`💳 Will execute real transactions: ${shouldUseRealTransactions ? '✅' : '❌'}`);
    }
    
    let paymentResult;
    
    if (individualTransactions && completedPayments.length > 0) {
      // Handle individual agent payments completed by frontend
      console.log('💳 Processing individual agent payment completion');
      console.log(`✅ Received ${completedPayments.length} completed individual payments`);
      
      const transactions = completedPayments.map((p: any) => p.txHash);
      const totalDistributed = completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      
      paymentResult = {
        success: true,
        transactions,
        errors: undefined
      };
      
      // Log each individual payment
      completedPayments.forEach((payment: any, index: number) => {
        console.log(`Individual Payment ${index + 1}: ${payment.agentId}`);
        console.log(`  💸 Amount: $${payment.amount} USDC (${(payment.percentage * 100).toFixed(2)}%)`);
        console.log(`  🎯 Address: ${payment.walletAddress}`);
        console.log(`  📝 TX Hash: ${payment.txHash}`);
        console.log(`  ⏰ Time: ${payment.timestamp}\n`);
      });
      
      console.log(`🎉 INDIVIDUAL PAYMENT SUMMARY:`);
      console.log(`- Total Individual Payments: ${completedPayments.length}`);
      console.log(`- Total Distributed: $${totalDistributed.toFixed(6)} USDC`);
      console.log(`- Payment Method: Individual x402 transactions to each agent address`);
      
    } else if (multipleTransactions && initialTxHash) {
      // Process multiple real transactions to each agent address
      if (isDevelopmentMode) {
        paymentResult = await agentWalletService.processMultipleAgentTransactions(
          distribution,
          userAddress,
          initialTxHash
        );
      } else {
        // Real on-chain transactions to each agent (requires private key)
        paymentResult = await agentWalletService.processMultipleAgentTransactions(
          distribution,
          userAddress,
          initialTxHash,
          process.env.OPERATOR_PRIVATE_KEY // In production, this would be user's private key
        );
      }
    } else {
      // Fallback to legacy method
      if (isDevelopmentMode) {
        paymentResult = await agentWalletService.processDirectPayments(
          distribution,
          userAddress
        );
      } else {
        paymentResult = await agentWalletService.processDirectPayments(
          distribution,
          userAddress,
          process.env.OPERATOR_PRIVATE_KEY
        );
      }
    }

    // Create payment record for tracking
    let paymentRecord;
    
    if (individualTransactions && completedPayments.length > 0) {
      // Use completed payments data for individual transactions
      paymentRecord = {
        taskId,
        userAddress,
        totalAmount: amount,
        timestamp: new Date().toISOString(),
        paymentMethod: 'individual_agent_transactions',
        distribution: completedPayments.map((payment: any) => ({
          agentId: payment.agentId,
          walletAddress: payment.walletAddress,
          amount: payment.amount,
          percentage: payment.percentage,
          transaction: payment.txHash,
          timestamp: payment.timestamp
        })),
        transactions: completedPayments.map((p: any) => p.txHash),
        transactionCount: completedPayments.length,
        totalAgents: completedPayments.length,
        totalDistributed: completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
        platformFee: {
          amount: amount * 0.05,
          description: 'Platform fee (5%) - accounted for in distribution calculation'
        },
        success: paymentResult.success,
        errors: paymentResult.errors
      };
    } else {
      // Standard payment record for other methods
      paymentRecord = {
        taskId,
        userAddress,
        totalAmount: amount,
        timestamp: new Date().toISOString(),
        paymentMethod: multipleTransactions ? 'multiple_agent_transactions' : 'direct_to_agents',
        initialTransaction: initialTxHash || undefined,
        distribution: distribution.distributions.map((d: any, index: number) => ({
          agentId: d.agentId,
          walletAddress: d.walletAddress,
          amount: Number(d.amount) / 1e6, // Convert back to USDC
          percentage: d.percentage,
          // Each agent gets their own transaction
          transaction: paymentResult.transactions[index]
        })),
        transactions: paymentResult.transactions,
        transactionCount: paymentResult.transactions.length,
        totalAgents: distribution.distributions.length,
        platformFee: {
          amount: amount * 0.05,
          description: 'Platform fee (5%) - accounted for in distribution calculation'
        },
        success: paymentResult.success,
        errors: paymentResult.errors
      };
    }

    console.log(`✅ Report access payment processed:`, paymentRecord);

    return NextResponse.json({
      success: true,
      paymentId: `payment-${taskId}-${Date.now()}`,
      message: individualTransactions 
        ? `Report access granted. ${completedPayments.length} individual x402 transactions completed to agent addresses.`
        : multipleTransactions 
        ? `Report access granted. ${paymentResult.transactions.length} on-chain transactions sent to ${distribution.distributions.length} agent addresses.`
        : 'Report access granted. Payment distributed to agents.',
      payment: paymentRecord,
      agentWallets: Array.from(agentWalletService.getAllAgentWallets().values()),
      developmentMode: isDevelopmentMode
    });

  } catch (error) {
    console.error('Report payment API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status for a task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing taskId parameter' },
        { status: 400 }
      );
    }

    // Initialize agent wallets if not already done
    await agentWalletService.initializeStandardAgentWallets();
    
    // Return agent wallet information
    const agentWallets = Array.from(agentWalletService.getAllAgentWallets().values());
    
    return NextResponse.json({
      success: true,
      taskId,
      agentWallets,
      message: 'Agent wallets initialized and ready for payments'
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
} 