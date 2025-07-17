'use client';

import { useState, useEffect } from 'react';
import { X402PaymentRequirements, PaymentStatus } from '@/types/payment';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRequirements: X402PaymentRequirements;
  agentName: string;
  onPaymentSuccess: (txHash: string) => void;
  onPaymentError: (error: string) => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  paymentRequirements,
  agentName,
  onPaymentSuccess,
  onPaymentError,
}: PaymentDialogProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [txHash, setTxHash] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const amount = parseFloat(paymentRequirements.maxAmountRequired) / 1e6; // Convert from wei to USDC
  const network = paymentRequirements.network;
  const isTestnet = network.includes('sepolia');

  useEffect(() => {
    if (paymentStatus === PaymentStatus.CAPTURED && txHash) {
      onPaymentSuccess(txHash);
    }
  }, [paymentStatus, txHash, onPaymentSuccess]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setPaymentStatus(PaymentStatus.PENDING);
      setTxHash('');
      setIsProcessing(false);
      setCurrentStep('');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus(PaymentStatus.PENDING);
      setCurrentStep('Initializing payment...');
      
      // Call the actual payment service
      setCurrentStep('Processing payment on Base Sepolia...');
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          network: network,
          agentId: agentName.toLowerCase().replace(/\s+/g, '-'),
          requirements: paymentRequirements
        })
      });
      
      setCurrentStep('Verifying transaction...');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setCurrentStep('Payment completed successfully!');
        setTxHash(result.txHash);
        setPaymentStatus(PaymentStatus.CAPTURED);
        setIsProcessing(false);
        onPaymentSuccess(result.txHash);
      } else {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Payment API Error:', errorMessage);
        console.error('Full response:', result);
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus(PaymentStatus.FAILED);
      setIsProcessing(false);
      setCurrentStep('Payment failed');
      
      // Show more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      const detailedError = errorMessage.includes('execution reverted') 
        ? 'Transaction failed - this might be due to insufficient funds, expired approval, or contract constraints'
        : errorMessage;
      
      onPaymentError(detailedError);
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case PaymentStatus.PENDING:
        return 'Processing...';
      case PaymentStatus.CAPTURED:
        return 'Payment Successful';
      case PaymentStatus.FAILED:
        return 'Payment Failed';
      default:
        return 'Ready to Pay';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case PaymentStatus.PENDING:
        return 'text-yellow-600';
      case PaymentStatus.CAPTURED:
        return 'text-green-600';
      case PaymentStatus.FAILED:
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Payment Required</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-lg mb-2">{agentName}</h3>
            <p className="text-gray-600 text-sm mb-4">{paymentRequirements.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amount:</span>
                <span className="font-mono text-lg">${amount.toFixed(3)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Network:</span>
                <span className={`text-sm px-2 py-1 rounded ${isTestnet ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {network}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Payment Method:</span>
                <span className="text-sm">Escrow (x402)</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              {currentStep && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-sm text-gray-600">{currentStep}</span>
                </div>
              )}
            </div>
          </div>

          {paymentStatus === PaymentStatus.CAPTURED && txHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-700 mb-2">
                <span className="text-sm font-medium">✓ Payment Confirmed</span>
              </div>
              <p className="text-xs text-green-600 font-mono">
                {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            {paymentStatus === PaymentStatus.CAPTURED ? (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                OK
              </button>
            ) : (
              <>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
                  disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-md text-white font-medium ${
                    isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </div>
              ) : (
                `Pay $${amount.toFixed(3)}`
              )}
            </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 