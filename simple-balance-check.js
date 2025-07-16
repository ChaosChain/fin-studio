#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createPublicClient, http, formatEther } = require('viem');
const { baseSepolia } = require('viem/chains');

async function checkBalance() {
  console.log('🔧 Testing connection to Base Sepolia...\n');
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID'),
  });
  
  const address = '0x963B1dDd7008e95cf9C8c65AD35B169bb7A59e01';
  
  try {
    console.log('📡 Checking ETH balance...');
    const ethBalance = await publicClient.getBalance({ address });
    console.log(`✅ ETH Balance: ${formatEther(ethBalance)} ETH`);
    
    console.log('📡 Checking USDC balance...');
    const usdcBalance = await publicClient.readContract({
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [address],
    });
    
    console.log(`✅ USDC Balance: ${Number(usdcBalance) / 1000000} USDC`);
    
    console.log('\n🎉 Connection successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBalance(); 