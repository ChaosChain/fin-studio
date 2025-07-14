import { A2AHttpGateway } from './lib/a2a/gateway';

const gateway = new A2AHttpGateway();

console.log('🚀 Starting Fin Studio A2A Gateway...');
console.log('📊 This will provide HTTP API for frontend-agent communication');
console.log('🔗 Frontend will connect to this gateway instead of WebSocket');

// Start the gateway server
gateway.start(8080);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down A2A Gateway...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down A2A Gateway...');
  process.exit(0);
}); 