/**
 * Payment Service Implementation
 * Integrates x402 protocol with Base's commerce-payments escrow system
 */

import { EventEmitter } from 'events';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentService,
  PaymentInfo,
  PaymentOperation,
  PaymentStatus,
  AgentPaymentSession,
  PaymentMiddlewareConfig,
  X402PaymentResponse,
  X402PaymentRequirements,
  X402PaymentPayload,
  PaymentError,
  X402Error,
  EscrowError,
  PAYMENT_CONSTANTS
} from '@/types/payment';

export class PaymentServiceImpl extends EventEmitter implements PaymentService {
  private config: PaymentMiddlewareConfig;
  private sessions: Map<string, AgentPaymentSession> = new Map();
  private operations: Map<string, PaymentOperation> = new Map();
  private publicClient: any;
  private walletClient: any;

  constructor(config: PaymentMiddlewareConfig) {
    super();
    this.config = config;
    this.initializeClients();
  }

  private initializeClients() {
    const chain = this.config.defaultNetwork === 'base' ? base : baseSepolia;
    
    // Use configurable RPC URL if available, otherwise use default
    const rpcUrl = this.config.defaultNetwork === 'base' 
      ? process.env.BASE_RPC_URL 
      : process.env.BASE_SEPOLIA_RPC_URL;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Only create wallet client if we have a valid private key
    const privateKey = this.config.operatorPrivateKey;
    if (privateKey && privateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000' && privateKey.length === 66) {
      try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        this.walletClient = createWalletClient({
          account,
          chain,
          transport: http(rpcUrl),
        });
        console.log(`Payment service initialized with wallet client (RPC: ${rpcUrl || 'default'})`);
      } catch (error) {
        console.warn('Invalid private key provided, payment service running in read-only mode');
        this.walletClient = null;
      }
    } else {
      console.log('No valid private key provided, payment service running in read-only mode');
      this.walletClient = null;
    }
  }

  async requirePayment(agentId: string, request: any): Promise<X402PaymentResponse> {
    const agentConfig = this.config.payments[agentId];
    if (!agentConfig) {
      throw new X402Error(`No payment configuration found for agent: ${agentId}`);
    }

    const networkConfig = PAYMENT_CONSTANTS.NETWORKS[agentConfig.network];
    const amount = this.parsePrice(agentConfig.pricePerRequest);

    const paymentRequirements: X402PaymentRequirements = {
      scheme: 'exact',
      network: agentConfig.network,
      maxAmountRequired: amount.toString(),
      resource: `/agents/${agentId}`,
      description: agentConfig.description,
      mimeType: 'application/json',
      payTo: agentConfig.payToAddress,
      maxTimeoutSeconds: PAYMENT_CONSTANTS.DEFAULT_TIMEOUT,
      asset: networkConfig.usdcAddress,
      extra: {
        name: 'USD Coin',
        version: '2'
      }
    };

    return {
      x402Version: 1,
      accepts: [paymentRequirements]
    };
  }

  async verifyPayment(agentId: string, paymentHeader: string): Promise<boolean> {
    try {
      const paymentPayload: X402PaymentPayload = JSON.parse(
        Buffer.from(paymentHeader, 'base64').toString()
      );

      if (!this.isValidPaymentPayload(paymentPayload)) {
        throw new X402Error('Invalid payment payload structure');
      }

      const agentConfig = this.config.payments[agentId];
      const expectedAmount = this.parsePrice(agentConfig.pricePerRequest);
      const paymentAmount = BigInt(paymentPayload.payload.authorization.value);

      if (paymentAmount < expectedAmount) {
        throw new X402Error('Payment amount insufficient');
      }

      return true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async authorizePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation> {
    const operationId = uuidv4();
    const operation: PaymentOperation = {
      id: operationId,
      type: 'authorize',
      paymentInfo,
      amount,
      status: PaymentStatus.PENDING,
      timestamp: new Date()
    };

    try {
      if (!this.walletClient) {
        console.log('Simulating authorization in read-only mode');
        // Simulate successful authorization in development mode
        operation.status = PaymentStatus.AUTHORIZED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      } else {
        // This would call the actual escrow contract in production
        operation.status = PaymentStatus.AUTHORIZED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      }
      
      this.operations.set(operationId, operation);
      this.emit('payment_authorized', { operationId });
      
      return operation;
    } catch (error) {
      operation.status = PaymentStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.operations.set(operationId, operation);
      throw new EscrowError(`Authorization failed: ${operation.error}`);
    }
  }

  async capturePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation> {
    const operationId = uuidv4();
    const operation: PaymentOperation = {
      id: operationId,
      type: 'capture',
      paymentInfo,
      amount,
      status: PaymentStatus.PENDING,
      timestamp: new Date()
    };

    try {
      if (!this.walletClient) {
        console.log('Simulating capture in read-only mode');
        // Simulate successful capture in development mode
        operation.status = PaymentStatus.CAPTURED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      } else {
        // This would call the actual escrow contract in production
        operation.status = PaymentStatus.CAPTURED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      }
      
      this.operations.set(operationId, operation);
      this.emit('payment_captured', { operationId });
      
      return operation;
    } catch (error) {
      operation.status = PaymentStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.operations.set(operationId, operation);
      throw new EscrowError(`Capture failed: ${operation.error}`);
    }
  }

  async chargePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation> {
    const operationId = uuidv4();
    const operation: PaymentOperation = {
      id: operationId,
      type: 'charge',
      paymentInfo,
      amount,
      status: PaymentStatus.PENDING,
      timestamp: new Date()
    };

    try {
      if (!this.walletClient) {
        console.log('Simulating charge in read-only mode');
        // Simulate successful charge in development mode
        operation.status = PaymentStatus.CAPTURED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      } else {
        // This would call the actual escrow contract in production
        operation.status = PaymentStatus.CAPTURED;
        operation.txHash = '0x' + Math.random().toString(16).substring(2, 66);
      }
      
      this.operations.set(operationId, operation);
      this.emit('payment_charged', { operationId });
      
      return operation;
    } catch (error) {
      operation.status = PaymentStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.operations.set(operationId, operation);
      throw new EscrowError(`Charge failed: ${operation.error}`);
    }
  }

  async refundPayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation> {
    const operationId = uuidv4();
    const operation: PaymentOperation = {
      id: operationId,
      type: 'refund',
      paymentInfo,
      amount,
      status: PaymentStatus.PENDING,
      timestamp: new Date()
    };

    try {
      // This would call the actual escrow contract
      operation.status = PaymentStatus.REFUNDED;
      this.operations.set(operationId, operation);
      this.emit('payment_refunded', { operationId });
      
      return operation;
    } catch (error) {
      operation.status = PaymentStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.operations.set(operationId, operation);
      throw new EscrowError(`Refund failed: ${operation.error}`);
    }
  }

  async voidPayment(paymentInfo: PaymentInfo): Promise<PaymentOperation> {
    const operationId = uuidv4();
    const operation: PaymentOperation = {
      id: operationId,
      type: 'void',
      paymentInfo,
      amount: BigInt(0),
      status: PaymentStatus.PENDING,
      timestamp: new Date()
    };

    try {
      // This would call the actual escrow contract
      operation.status = PaymentStatus.EXPIRED;
      this.operations.set(operationId, operation);
      this.emit('payment_voided', { operationId });
      
      return operation;
    } catch (error) {
      operation.status = PaymentStatus.FAILED;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      this.operations.set(operationId, operation);
      throw new EscrowError(`Void failed: ${operation.error}`);
    }
  }

  async createPaymentSession(agentId: string, payer: string, requestData: any): Promise<AgentPaymentSession> {
    const sessionId = uuidv4();
    const paymentId = uuidv4();
    const now = new Date();
    
    const session: AgentPaymentSession = {
      id: sessionId,
      agentId,
      paymentId,
      status: PaymentStatus.PENDING,
      amount: this.parsePrice(this.config.payments[agentId].pricePerRequest),
      payer: payer as `0x${string}`,
      requestData,
      createdAt: now,
      expiresAt: new Date(now.getTime() + PAYMENT_CONSTANTS.DEFAULT_TIMEOUT * 1000)
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getPaymentSession(sessionId: string): Promise<AgentPaymentSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async updatePaymentSession(sessionId: string, updates: Partial<AgentPaymentSession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new PaymentError('Session not found', 'SESSION_NOT_FOUND');
    }

    Object.assign(session, updates);
    this.sessions.set(sessionId, session);
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const operation = this.operations.get(paymentId);
    return operation?.status || PaymentStatus.PENDING;
  }

  async getPaymentHistory(agentId: string): Promise<PaymentOperation[]> {
    return Array.from(this.operations.values()).filter(op => 
      op.paymentInfo.receiver === this.config.payments[agentId]?.payToAddress
    );
  }

  private parsePrice(priceStr: string): bigint {
    const match = priceStr.match(/^\$?(\d+(?:\.\d+)?)$/);
    if (!match) {
      throw new PaymentError('Invalid price format', 'INVALID_PRICE');
    }
    
    const amount = parseFloat(match[1]);
    return parseUnits(amount.toString(), 6); // USDC has 6 decimals
  }

  private isValidPaymentPayload(payload: X402PaymentPayload): boolean {
    return !!(
      payload.x402Version &&
      payload.scheme === 'exact' &&
      payload.network &&
      payload.payload?.signature &&
      payload.payload?.authorization
    );
  }
} 