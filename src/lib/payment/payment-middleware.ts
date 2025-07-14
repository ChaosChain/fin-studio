/**
 * Payment Middleware for A2A Agents
 * Handles payment requirements and verification for agent requests
 */

import { PaymentServiceImpl } from './payment-service';
import { A2AMessage, A2AMessageType } from '@/types/a2a';
import {
  PaymentMiddlewareConfig,
  AgentPaymentConfig,
  PaymentStatus,
  PaymentError,
  X402Error,
  PAYMENT_CONSTANTS
} from '@/types/payment';

export class PaymentMiddleware {
  private paymentService: PaymentServiceImpl;
  private config: PaymentMiddlewareConfig;

  constructor(config: PaymentMiddlewareConfig) {
    this.config = config;
    this.paymentService = new PaymentServiceImpl(config);
  }

  /**
   * Middleware function to be used with A2A agents
   * Checks for payment requirements and verifies payments
   */
  async handleMessage(message: A2AMessage, next: () => Promise<void>): Promise<void> {
    const agentId = message.target.id;
    const agentConfig = this.config.payments[agentId];

    // If no payment configuration, proceed without payment
    if (!agentConfig) {
      await next();
      return;
    }

    // Check if payment is required for this action
    const requiresPayment = this.actionRequiresPayment(agentId, message.payload.action);
    if (!requiresPayment) {
      await next();
      return;
    }

    // Check for existing payment
    const paymentHeader = message.metadata?.payment;
    if (!paymentHeader) {
      // No payment provided, return 402 Payment Required
      await this.sendPaymentRequiredResponse(message, agentId);
      return;
    }

    // Verify payment
    const isValidPayment = await this.verifyPayment(agentId, paymentHeader);
    if (!isValidPayment) {
      await this.sendPaymentFailedResponse(message, 'Invalid payment');
      return;
    }

    // Payment verified, proceed with request
    await next();
  }

  /**
   * Check if a specific action requires payment
   */
  private actionRequiresPayment(agentId: string, action: string): boolean {
    const agentConfig = this.config.payments[agentId];
    if (!agentConfig) return false;

    // For now, all actions require payment if agent is configured for payments
    // This could be made more granular based on specific actions
    return true;
  }

  /**
   * Send 402 Payment Required response
   */
  private async sendPaymentRequiredResponse(message: A2AMessage, agentId: string): Promise<void> {
    try {
      const paymentRequirements = await this.paymentService.requirePayment(agentId, message.payload.data);
      
      const response: A2AMessage = {
        id: message.id + '_payment_required',
        type: A2AMessageType.ERROR,
        timestamp: new Date(),
        source: message.target,
        target: message.source,
        payload: {
          action: 'payment_required',
          data: paymentRequirements
        },
        metadata: {
          statusCode: 402,
          responseToMessageId: message.id
        }
      };

      // In a real implementation, this would send the response back to the client
      console.log('Payment required response:', response);
    } catch (error) {
      console.error('Failed to create payment requirements:', error);
    }
  }

  /**
   * Send payment failed response
   */
  private async sendPaymentFailedResponse(message: A2AMessage, reason: string): Promise<void> {
    const response: A2AMessage = {
      id: message.id + '_payment_failed',
      type: A2AMessageType.ERROR,
      timestamp: new Date(),
      source: message.target,
      target: message.source,
      payload: {
        action: 'payment_failed',
        data: {
          error: reason,
          message: 'Payment verification failed'
        }
      },
      metadata: {
        statusCode: 402,
        responseToMessageId: message.id
      }
    };

    // In a real implementation, this would send the response back to the client
    console.log('Payment failed response:', response);
  }

  /**
   * Verify payment using the payment service
   */
  private async verifyPayment(agentId: string, paymentHeader: string): Promise<boolean> {
    try {
      return await this.paymentService.verifyPayment(agentId, paymentHeader);
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Create payment session for a user request
   */
  async createPaymentSession(agentId: string, payer: string, requestData: any) {
    return await this.paymentService.createPaymentSession(agentId, payer, requestData);
  }

  /**
   * Get payment session details
   */
  async getPaymentSession(sessionId: string) {
    return await this.paymentService.getPaymentSession(sessionId);
  }

  /**
   * Update payment session status
   */
  async updatePaymentSession(sessionId: string, updates: any) {
    return await this.paymentService.updatePaymentSession(sessionId, updates);
  }

  /**
   * Get payment history for an agent
   */
  async getPaymentHistory(agentId: string) {
    return await this.paymentService.getPaymentHistory(agentId);
  }
}

/**
 * Factory function to create payment middleware instance
 */
export function createPaymentMiddleware(config: PaymentMiddlewareConfig): PaymentMiddleware {
  return new PaymentMiddleware(config);
}

/**
 * Default payment configuration for development
 */
export const DEFAULT_PAYMENT_CONFIG: PaymentMiddlewareConfig = {
  payments: {
    'market-research-agent': {
      pricePerRequest: '$0.01',
      network: 'base-sepolia',
      payToAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      description: 'Market Research and Analysis',
      enableEscrow: true,
      authorizationExpiry: 3600, // 1 hour
      refundExpiry: 86400, // 24 hours
      feeBps: 250 // 2.5%
    },
    'macro-research-agent': {
      pricePerRequest: '$0.02',
      network: 'base-sepolia',
      payToAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      description: 'Macro Economic Research',
      enableEscrow: true,
      authorizationExpiry: 3600,
      refundExpiry: 86400,
      feeBps: 250
    },
    'price-analysis-agent': {
      pricePerRequest: '$0.005',
      network: 'base-sepolia',
      payToAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      description: 'Price Analysis and Technical Indicators',
      enableEscrow: true,
      authorizationExpiry: 3600,
      refundExpiry: 86400,
      feeBps: 250
    },
    'insights-agent': {
      pricePerRequest: '$0.03',
      network: 'base-sepolia',
      payToAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      description: 'AI-Generated Investment Insights',
      enableEscrow: true,
      authorizationExpiry: 3600,
      refundExpiry: 86400,
      feeBps: 250
    }
  },
  facilitatorUrl: 'https://x402.org/facilitator',
  escrowContractAddress: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff' as `0x${string}`,
  defaultNetwork: 'base-sepolia',
  operatorAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  operatorPrivateKey: '0x0000000000000000000000000000000000000000000000000000000000000000'
};

/**
 * Helper function to wrap A2A middleware with payment functionality
 */
export function withPaymentMiddleware(
  middleware: any[], 
  config: PaymentMiddlewareConfig
): any[] {
  const paymentMiddleware = createPaymentMiddleware(config);
  
  return [
    ...middleware,
    async (message: A2AMessage, next: () => Promise<void>) => {
      await paymentMiddleware.handleMessage(message, next);
    }
  ];
} 