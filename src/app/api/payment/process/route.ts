import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract addresses
const CONTRACTS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
  ESCROW: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff' as `0x${string}`,
  PREAPPROVAL_COLLECTOR: '0x1b77ABd71FCD21fbe2398AE821Aa27D1E6B94bC6' as `0x${string}`,
};

// ABIs
const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const ESCROW_ABI = [
  {
    name: 'authorize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'paymentInfo', type: 'tuple', components: [
        { name: 'operator', type: 'address' },
        { name: 'payer', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'maxAmount', type: 'uint120' },
        { name: 'preApprovalExpiry', type: 'uint48' },
        { name: 'authorizationExpiry', type: 'uint48' },
        { name: 'refundExpiry', type: 'uint48' },
        { name: 'minFeeBps', type: 'uint16' },
        { name: 'maxFeeBps', type: 'uint16' },
        { name: 'feeReceiver', type: 'address' },
        { name: 'salt', type: 'uint256' },
      ]},
      { name: 'amount', type: 'uint256' },
      { name: 'tokenCollector', type: 'address' },
      { name: 'collectorData', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'capture',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'paymentInfo', type: 'tuple', components: [
        { name: 'operator', type: 'address' },
        { name: 'payer', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'maxAmount', type: 'uint120' },
        { name: 'preApprovalExpiry', type: 'uint48' },
        { name: 'authorizationExpiry', type: 'uint48' },
        { name: 'refundExpiry', type: 'uint48' },
        { name: 'minFeeBps', type: 'uint16' },
        { name: 'maxFeeBps', type: 'uint16' },
        { name: 'feeReceiver', type: 'address' },
        { name: 'salt', type: 'uint256' },
      ]},
      { name: 'amount', type: 'uint256' },
      { name: 'feeBps', type: 'uint16' },
      { name: 'feeReceiver', type: 'address' },
    ],
    outputs: [],
  },
];

const PREAPPROVAL_COLLECTOR_ABI = [
  {
    name: 'preApprove',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'paymentInfo', type: 'tuple', components: [
        { name: 'operator', type: 'address' },
        { name: 'payer', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'maxAmount', type: 'uint120' },
        { name: 'preApprovalExpiry', type: 'uint48' },
        { name: 'authorizationExpiry', type: 'uint48' },
        { name: 'refundExpiry', type: 'uint48' },
        { name: 'minFeeBps', type: 'uint16' },
        { name: 'maxFeeBps', type: 'uint16' },
        { name: 'feeReceiver', type: 'address' },
        { name: 'salt', type: 'uint256' },
      ]},
    ],
    outputs: [],
  },
];

export async function POST(request: NextRequest) {
  try {
    const { amount, network, agentId } = await request.json();
    
    // Validate inputs
    if (!amount || !network || !agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize clients
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    const privateKey = process.env.OPERATOR_PRIVATE_KEY;
    
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'No private key configured' },
        { status: 500 }
      );
    }

    const account = privateKeyToAccount((privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    // Convert amount to wei
    const amountWei = parseUnits(amount.toString(), 6);
    const recipient = process.env.AGENT_WALLET_ADDRESS as `0x${string}`;
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'No agent wallet address configured' },
        { status: 500 }
      );
    }

    // Step 1: Check and approve USDC if needed
    let approvalTxHash = '' as `0x${string}`;
    
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [account.address, CONTRACTS.PREAPPROVAL_COLLECTOR],
    }) as bigint;

    if (currentAllowance < amountWei) {
      // Need to approve
      approvalTxHash = await walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PREAPPROVAL_COLLECTOR, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
    }

    // Step 2: Create payment info with correct timing (matching working test)
    const now = Math.floor(Date.now() / 1000);
    const paymentInfo = {
      operator: account.address,
      payer: account.address,
      receiver: recipient,
      token: CONTRACTS.USDC,
      maxAmount: amountWei,
      preApprovalExpiry: now + 3600,  // 1 hour from now
      authorizationExpiry: now + 7200, // 2 hours from now
      refundExpiry: now + 86400,      // 24 hours from now
      minFeeBps: 0,
      maxFeeBps: 0,                   // 0 (not 500)
      feeReceiver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      salt: Math.floor(Math.random() * 1000000),
    };

    // Step 3: Pre-approve payment
    console.log('🔓 PRE-APPROVING PAYMENT');
    console.log('Payment info:', JSON.stringify(paymentInfo, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    , 2));
    
    const preApprovalTxHash = await walletClient.writeContract({
      address: CONTRACTS.PREAPPROVAL_COLLECTOR,
      abi: PREAPPROVAL_COLLECTOR_ABI,
      functionName: 'preApprove',
      args: [paymentInfo],
    });
    console.log('✅ Pre-approval transaction sent:', preApprovalTxHash);
    
    const preApprovalReceipt = await publicClient.waitForTransactionReceipt({ hash: preApprovalTxHash });
    console.log('✅ Pre-approval confirmed in block:', preApprovalReceipt.blockNumber);

    // Step 4: Authorize payment using the pre-approval collector
    console.log('🔒 AUTHORIZING PAYMENT');
    const authorizationTxHash = await walletClient.writeContract({
      address: CONTRACTS.ESCROW,
      abi: ESCROW_ABI,
      functionName: 'authorize',
      args: [paymentInfo, amountWei, CONTRACTS.PREAPPROVAL_COLLECTOR, '0x'],
    });
    console.log('✅ Authorization transaction sent:', authorizationTxHash);
    
    const authorizationReceipt = await publicClient.waitForTransactionReceipt({ hash: authorizationTxHash });
    console.log('✅ Authorization confirmed in block:', authorizationReceipt.blockNumber);

    // Step 5: Capture payment
    console.log('💸 CAPTURING PAYMENT');
    const captureTxHash = await walletClient.writeContract({
      address: CONTRACTS.ESCROW,
      abi: ESCROW_ABI,
      functionName: 'capture',
      args: [paymentInfo, amountWei, 0, '0x0000000000000000000000000000000000000000' as `0x${string}`],
    });
    console.log('✅ Capture transaction sent:', captureTxHash);
    
    const captureReceipt = await publicClient.waitForTransactionReceipt({ hash: captureTxHash });
    console.log('✅ Capture confirmed in block:', captureReceipt.blockNumber);
    console.log('🎉 Payment flow completed successfully!');

    return NextResponse.json({
      success: true,
      txHash: captureTxHash,
      approvalTxHash,
      preApprovalTxHash,
      authorizationTxHash,
      captureTxHash,
      amount: formatUnits(amountWei, 6),
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    );
  }
} 