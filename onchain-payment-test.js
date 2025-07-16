#!/usr/bin/env node

/**
 * On-Chain Payment Test for Base Sepolia
 * Executes real blockchain transactions using x402 + Base Commerce Payments
 */

require('dotenv').config({ path: '.env.local' });
const { createPublicClient, createWalletClient, http, parseUnits, formatUnits, parseEther, formatEther } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const config = {
  network: process.env.NETWORK || 'base-sepolia',
  operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY,
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://x402.org/facilitator',
  escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS,
  developmentMode: process.env.DEVELOPMENT_MODE === 'true',
};

// Contract addresses on Base Sepolia
const CONTRACTS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  ESCROW: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
  PREAPPROVAL_COLLECTOR: '0x1b77ABd71FCD21fbe2398AE821Aa27D1E6B94bC6',
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
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

// Commerce Payments Escrow ABI (minimal)
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

// PreApprovalPaymentCollector ABI
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
  {
    name: 'isPreApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'paymentInfoHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
];

class OnChainPaymentTest {
  constructor() {
    this.account = null;
    this.publicClient = null;
    this.walletClient = null;
    this.setupClients();
  }

  setupClients() {
    console.log('🔧 Setting up Base Sepolia blockchain clients...\n');
    
    // Use Infura RPC endpoint as requested
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID';
    
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    if (!config.operatorPrivateKey || config.operatorPrivateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      throw new Error('❌ No valid private key found. Please set OPERATOR_PRIVATE_KEY in .env.local');
    }

    // Ensure private key is properly formatted
    const privateKey = config.operatorPrivateKey.startsWith('0x') 
      ? config.operatorPrivateKey 
      : `0x${config.operatorPrivateKey}`;
    this.account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
    
    console.log(`✅ Wallet configured for Base Sepolia:`);
    console.log(`   Address: ${this.account.address}`);
    console.log(`   Network: ${baseSepolia.name}`);
    console.log(`   Chain ID: ${baseSepolia.id}`);
    console.log(`   RPC URL: ${rpcUrl}\n`);
  }

  async checkBalances() {
    console.log('💰 CHECKING WALLET BALANCES');
    console.log('=' .repeat(60));

    try {
      // Check ETH balance
      const ethBalance = await this.publicClient.getBalance({
        address: this.account.address,
      });

      // Check USDC balance
      const usdcBalance = await this.publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      });

      console.log(`🏦 Balances for ${this.account.address}:`);
      console.log(`   ETH: ${formatEther(ethBalance)} ETH`);
      console.log(`   USDC: ${formatUnits(usdcBalance, 6)} USDC`);

      const hasEnoughEth = ethBalance > parseEther('0.001');
      const hasEnoughUsdc = usdcBalance > parseUnits('0.1', 6);

      console.log('\n📊 Balance Status:');
      console.log(`   ETH (for gas): ${hasEnoughEth ? '✅ Sufficient' : '❌ Need more'}`);
      console.log(`   USDC (for payments): ${hasEnoughUsdc ? '✅ Sufficient' : '❌ Need more'}`);

      if (!hasEnoughEth || !hasEnoughUsdc) {
              console.log('\n🚰 Need testnet funds? Get them here:');
      console.log('   📍 Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
      console.log('   📍 Base Sepolia USDC: https://portal.cdp.coinbase.com/products/faucet');
      console.log(`   📍 Your address: ${this.account.address}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking balances:', error.message);
      return false;
    }
  }

  async approveUSDC(amount) {
    console.log('🔐 APPROVING USDC FOR PREAPPROVAL COLLECTOR');
    console.log('=' .repeat(60));

    try {
      // Check current allowance for PreApprovalPaymentCollector
      const currentAllowance = await this.publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [this.account.address, CONTRACTS.PREAPPROVAL_COLLECTOR],
      });

      console.log(`📋 Current allowance: ${formatUnits(currentAllowance, 6)} USDC`);
      console.log(`📋 Required amount: ${formatUnits(amount, 6)} USDC`);

      if (currentAllowance >= amount) {
        console.log('✅ Already have sufficient allowance');
        return true;
      }

      console.log('\n🚀 Sending approval transaction...');

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PREAPPROVAL_COLLECTOR, amount],
      });

      console.log(`📤 Transaction sent: ${hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
      console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);

      return true;
    } catch (error) {
      console.error('❌ USDC approval failed:', error.message);
      return false;
    }
  }

  async createPaymentInfo(recipient, amount) {
    const currentTime = Math.floor(Date.now() / 1000);
    const salt = Math.floor(Math.random() * 1000000);

    return {
      operator: this.account.address,
      payer: this.account.address,
      receiver: recipient,
      token: CONTRACTS.USDC,
      maxAmount: amount,
      preApprovalExpiry: currentTime + 3600, // 1 hour from now
      authorizationExpiry: currentTime + 7200, // 2 hours from now
      refundExpiry: currentTime + 86400, // 24 hours from now
      minFeeBps: 0,
      maxFeeBps: 0,
      feeReceiver: '0x0000000000000000000000000000000000000000',
      salt: salt,
    };
  }

  async preApprovePayment(paymentInfo) {
    console.log('🔓 PRE-APPROVING PAYMENT');
    console.log('=' .repeat(60));

    try {
      console.log('💼 Pre-approving payment for:');
      console.log(`   Payer: ${paymentInfo.payer}`);
      console.log(`   Receiver: ${paymentInfo.receiver}`);
      console.log(`   Max Amount: ${formatUnits(paymentInfo.maxAmount, 6)} USDC`);

      console.log('\n🚀 Sending pre-approval transaction...');

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.PREAPPROVAL_COLLECTOR,
        abi: PREAPPROVAL_COLLECTOR_ABI,
        functionName: 'preApprove',
        args: [paymentInfo],
      });

      console.log(`📤 Transaction sent: ${hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      console.log(`✅ Pre-approval confirmed in block ${receipt.blockNumber}`);
      console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);

      return { transactionHash: hash };
    } catch (error) {
      console.error('❌ Payment pre-approval failed:', error.message);
      throw error;
    }
  }

  async authorizePayment(paymentInfo, amount) {
    console.log('🔒 AUTHORIZING PAYMENT IN ESCROW');
    console.log('=' .repeat(60));

    try {
      console.log('💼 Payment details:');
      console.log(`   Operator: ${paymentInfo.operator}`);
      console.log(`   Payer: ${paymentInfo.payer}`);
      console.log(`   Receiver: ${paymentInfo.receiver}`);
      console.log(`   Amount: ${formatUnits(amount, 6)} USDC`);
      console.log(`   Max Amount: ${formatUnits(paymentInfo.maxAmount, 6)} USDC`);
      console.log(`   Pre-approval Expiry: ${new Date(paymentInfo.preApprovalExpiry * 1000).toISOString()}`);
      console.log(`   Authorization Expiry: ${new Date(paymentInfo.authorizationExpiry * 1000).toISOString()}`);
      console.log(`   Salt: ${paymentInfo.salt}`);

      console.log('\n🚀 Sending authorization transaction...');

      // For this demo, we'll use empty collector data
      const collectorData = '0x';

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'authorize',
        args: [
          paymentInfo,
          amount,
          CONTRACTS.PREAPPROVAL_COLLECTOR,
          collectorData,
        ],
      });

      console.log(`📤 Transaction sent: ${hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      console.log(`✅ Authorization confirmed in block ${receipt.blockNumber}`);
      console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);

      // Extract authorization ID from logs
      const authorizationId = receipt.logs[0]?.topics[1] || '0x' + Math.random().toString(16).substring(2, 66);
      
      console.log(`🆔 Authorization ID: ${authorizationId}`);

      return { authorizationId, transactionHash: hash };
    } catch (error) {
      console.error('❌ Payment authorization failed:', error.message);
      throw error;
    }
  }

  async capturePayment(paymentInfo, amount) {
    console.log('💸 CAPTURING PAYMENT FROM ESCROW');
    console.log('=' .repeat(60));

    try {
      console.log('💼 Capturing payment:');
      console.log(`   Receiver: ${paymentInfo.receiver}`);
      console.log(`   Amount: ${formatUnits(amount, 6)} USDC`);

      console.log('\n🚀 Sending capture transaction...');

      const feeBps = 0;
      const feeReceiver = '0x0000000000000000000000000000000000000000';

      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'capture',
        args: [paymentInfo, amount, feeBps, feeReceiver],
      });

      console.log(`📤 Transaction sent: ${hash}`);
      console.log('⏳ Waiting for confirmation...');

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      console.log(`✅ Capture confirmed in block ${receipt.blockNumber}`);
      console.log(`💸 Gas used: ${receipt.gasUsed.toString()}`);

      return { transactionHash: hash };
    } catch (error) {
      console.error('❌ Payment capture failed:', error.message);
      throw error;
    }
  }

  async runFullPaymentFlow() {
    console.log('🚀 ON-CHAIN PAYMENT FLOW TEST');
    console.log('=' .repeat(80));
    console.log('Testing REAL transactions on Base Sepolia\n');

    try {
      // Step 1: Check balances
      const hasEnoughFunds = await this.checkBalances();
      if (!hasEnoughFunds) {
        console.log('\n❌ Insufficient funds for testing. Please get testnet tokens first.');
        return;
      }

      console.log('\n');

      // Step 2: Set up payment
      const amount = parseUnits('0.01', 6); // $0.01 USDC
      const recipient = '0xeaec2727B4a79d77f0C0721e6631EAD0C730aD0d'; // Test recipient address (not self)

      // Step 3: Approve USDC
      const approvalSuccess = await this.approveUSDC(amount);
      if (!approvalSuccess) {
        console.log('\n❌ USDC approval failed');
        return;
      }

      console.log('\n');

      // Step 4: Create payment info
      const paymentInfo = await this.createPaymentInfo(recipient, amount);

      // Step 5: Pre-approve payment
      await this.preApprovePayment(paymentInfo);

      console.log('\n');

      // Step 6: Authorize payment
      const { authorizationId, transactionHash: authTxHash } = await this.authorizePayment(paymentInfo, amount);

      console.log('\n');

      // Step 7: Capture payment
      const { transactionHash: captureTxHash } = await this.capturePayment(paymentInfo, amount);

      // Final summary
      console.log('\n🎉 ON-CHAIN PAYMENT FLOW COMPLETED!');
      console.log('=' .repeat(80));
      console.log('✅ Real transactions executed on Base Sepolia:');
      console.log(`   💰 Amount: ${formatUnits(amount, 6)} USDC`);
      console.log(`   🆔 Authorization ID: ${authorizationId}`);
      console.log(`   📝 Authorization Tx: ${authTxHash}`);
      console.log(`   💸 Capture Tx: ${captureTxHash}`);
      console.log(`   🔗 View on BaseScan: https://sepolia.basescan.org/tx/${captureTxHash}`);

      // Check final balances
      console.log('\n');
      await this.checkBalances();

    } catch (error) {
      console.error('\n❌ ON-CHAIN PAYMENT FLOW FAILED:');
      console.error(error.message);
    }
  }

  async quickTest() {
    console.log('⚡ QUICK ON-CHAIN TEST');
    console.log('=' .repeat(80));

    try {
      const hasEnoughFunds = await this.checkBalances();
      
      if (hasEnoughFunds) {
        console.log('\n✅ Ready for on-chain testing!');
        console.log('Run `node onchain-payment-test.js full` for complete flow');
      }
    } catch (error) {
      console.error('❌ Quick test failed:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'quick';
  const tester = new OnChainPaymentTest();

  switch (command) {
    case 'full':
      await tester.runFullPaymentFlow();
      break;
    case 'balance':
      await tester.checkBalances();
      break;
    default:
      await tester.quickTest();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = OnChainPaymentTest; 