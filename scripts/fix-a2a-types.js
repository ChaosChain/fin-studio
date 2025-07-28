#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need to be updated
const files = [
  'src/agents/market-research-agent.ts',
  'src/agents/macro-research-agent.ts', 
  'src/agents/price-analysis-agent.ts',
  'src/agents/insights-agent.ts',
  'src/agents/verifier-agent.ts',
  'src/agents/manager.ts',
  'src/lib/payment/payment-middleware.ts',
  'src/lib/a2a-sdk/agent-executor.ts'
];

// Type mappings
const typeMappings = {
  'A2AMessage': 'GoogleA2AMessage',
  'AgentIdentity': 'GoogleA2AAgentIdentity', 
  'AgentType': 'GoogleA2AAgentType',
  'A2AHandlerFunction': 'GoogleA2AHandlerFunction',
  'A2AMessageType': 'GoogleA2AMessageType',
  'A2AAgentStatus': 'GoogleA2AAgentStatus',
  'A2AMetrics': 'GoogleA2AMetrics',
  'A2ARegistryEntry': 'GoogleA2ARegistryEntry',
  'A2ARegistry': 'GoogleA2ARegistry'
};

// Import mappings
const importMappings = {
  '@/types/a2a': '@/types/google-a2a'
};

function updateFile(filePath) {
  console.log(`Updating ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update imports
  content = content.replace(
    /from ['"]@\/types\/a2a['"]/g,
    "from '@/types/google-a2a'"
  );
  
  // Update type references
  Object.entries(typeMappings).forEach(([oldType, newType]) => {
    const regex = new RegExp(`\\b${oldType}\\b`, 'g');
    content = content.replace(regex, newType);
  });
  
  // Special handling for Google A2A SDK types
  content = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/types\/a2a['"]/g,
    (match, types) => {
      const updatedTypes = types.split(',').map(type => {
        const trimmed = type.trim();
        return typeMappings[trimmed] || trimmed;
      }).join(', ');
      return `import { ${updatedTypes} } from '@/types/google-a2a'`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath}`);
}

// Update all files
files.forEach(file => {
  if (fs.existsSync(file)) {
    updateFile(file);
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log('\n🎉 All A2A type references updated to use Google A2A SDK!');
console.log('\nNext steps:');
console.log('1. Run: yarn agents:build');
console.log('2. Run: yarn dev');
console.log('3. Access demo at: http://localhost:3000/chaos-demo'); 