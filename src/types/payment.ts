/**
 * Payment System Types
 * Integrates x402 protocol with Base's commerce-payments escrow system
 */

import { Address } from 'viem';

// X402 Protocol Types
export interface X402PaymentRequirements {
  scheme: 'exact';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
  outputSchema?: object;
  extra?: {
    name: string;
    version: string;
  };
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: Address;
      to: Address;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface X402PaymentResponse {
  x402Version: number;
  accepts: X402PaymentRequirements[];
  error?: string;
}

// Commerce Payments (Base Escrow) Types
export interface PaymentInfo {
  operator: Address;
  payer: Address;
  receiver: Address;
  token: Address;
  maxAmount: bigint;
  preApprovalExpiry: number;
  authorizationExpiry: number;
  refundExpiry: number;
  minFeeBps: number;
  maxFeeBps: number;
  feeReceiver: Address;
  salt: bigint;
}

export interface PaymentState {
  hasCollectedPayment: boolean;
  capturableAmount: bigint;
  refundableAmount: bigint;
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface PaymentOperation {
  id: string;
  type: 'authorize' | 'capture' | 'charge' | 'refund' | 'void';
  paymentInfo: PaymentInfo;
  amount: bigint;
  status: PaymentStatus;
  txHash?: string;
  timestamp: Date;
  error?: string;
}

// Agent Payment Integration Types
export interface AgentPaymentConfig {
  pricePerRequest: string; // e.g., "$0.01"
  network: 'base' | 'base-sepolia';
  payToAddress: Address;
  description: string;
  enableEscrow: boolean;
  authorizationExpiry: number; // seconds
  refundExpiry: number; // seconds
  feeBps: number; // basis points
}

export interface AgentPaymentSession {
  id: string;
  agentId: string;
  paymentId: string;
  status: PaymentStatus;
  amount: bigint;
  payer: Address;
  requestData: any;
  response?: any;
  createdAt: Date;
  expiresAt: Date;
}

export interface PaymentMiddlewareConfig {
  payments: Record<string, AgentPaymentConfig>; // agentId -> config
  facilitatorUrl: string;
  escrowContractAddress: Address;
  defaultNetwork: 'base' | 'base-sepolia';
  operatorAddress: Address;
  operatorPrivateKey: string;
}

// Payment Service Interface
export interface PaymentService {
  // X402 Protocol Methods
  requirePayment(agentId: string, request: any): Promise<X402PaymentResponse>;
  verifyPayment(agentId: string, paymentHeader: string): Promise<boolean>;
  
  // Commerce Payments Methods
  authorizePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation>;
  capturePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation>;
  chargePayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation>;
  refundPayment(paymentInfo: PaymentInfo, amount: bigint): Promise<PaymentOperation>;
  voidPayment(paymentInfo: PaymentInfo): Promise<PaymentOperation>;
  
  // Session Management
  createPaymentSession(agentId: string, payer: Address, requestData: any): Promise<AgentPaymentSession>;
  getPaymentSession(sessionId: string): Promise<AgentPaymentSession | null>;
  updatePaymentSession(sessionId: string, updates: Partial<AgentPaymentSession>): Promise<void>;
  
  // Utilities
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  getPaymentHistory(agentId: string): Promise<PaymentOperation[]>;
}

// Event Types
export interface PaymentEvent {
  type: 'payment_required' | 'payment_authorized' | 'payment_captured' | 'payment_failed';
  agentId: string;
  sessionId: string;
  paymentId?: string;
  amount: bigint;
  payer: Address;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Error Types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class X402Error extends PaymentError {
  constructor(message: string, details?: any) {
    super(message, 'X402_ERROR', details);
  }
}

export class EscrowError extends PaymentError {
  constructor(message: string, details?: any) {
    super(message, 'ESCROW_ERROR', details);
  }
}

// Constants
export const PAYMENT_CONSTANTS = {
  DEFAULT_TIMEOUT: 300, // 5 minutes
  DEFAULT_FEE_BPS: 250, // 2.5%
  MIN_PAYMENT_AMOUNT: BigInt(1000), // 0.001 USDC (assuming 6 decimals)
  MAX_PAYMENT_AMOUNT: BigInt(1000000000), // 1000 USDC
  NETWORKS: {
    'base': {
      chainId: 8453,
      name: 'Base',
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      escrowAddress: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff' as Address,
    },
    'base-sepolia': {
      chainId: 84532,
      name: 'Base Sepolia',
      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
      escrowAddress: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff' as Address,
    }
  }
} as const; 