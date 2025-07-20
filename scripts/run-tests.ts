#!/usr/bin/env ts-node

import { runARNTests } from '../tests/agent-relay-network.test';

async function main() {
  try {
    console.log('🚀 Starting Agent Relay Network Test Suite...\n');
    
    const summary = await runARNTests();
    
    console.log('\n🏁 Test run completed!');
    
    if (summary.failed > 0) {
      console.log('❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  }
}

main(); 