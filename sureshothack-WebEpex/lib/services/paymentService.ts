/**
 * Payment Service
 * Handles payment-related business logic
 */

import { verifyPayUSignature, getPayUMerchantSalt, validatePaymentAmount } from '@/lib/utils/payu';
import { updateUserStatus } from './userService';
import type { PayUVerifyRequest } from '@/lib/types/payu';

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
  payment?: {
    orderId: string;
    paymentId: string;
  };
  user?: {
    id: string;
    email: string;
    isVip: boolean;
    isPremium: boolean;
    vipExpiresAt: Date | null;
  };
}

/**
 * Calculate VIP expiry date (30 days from now)
 */
export const calculateVipExpiryDate = (): Date => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // Add 30 days
  return expiryDate;
};

/**
 * Check if VIP subscription is expired
 */
export const isVipExpired = (vipExpiresAt: Date | null | undefined): boolean => {
  if (!vipExpiresAt) {
    return true; // No expiry date means expired
  }
  return new Date() > new Date(vipExpiresAt);
};

/**
 * Verify PayU payment and update user VIP status with 30-day expiry
 * @param userId User ID
 * @param paymentData Payment verification data from PayU
 * @returns Payment verification result
 */
export const verifyPaymentAndUpdateUser = async (
  userId: string,
  paymentData: PayUVerifyRequest
): Promise<PaymentVerificationResult> => {
  try {
    const salt = getPayUMerchantSalt();

    // Verify PayU signature
    const isSignatureValid = verifyPayUSignature(paymentData, salt);

    if (!isSignatureValid) {
      return {
        success: false,
        message: 'Invalid payment signature',
      };
    }

    // Check if payment status is success
    if (paymentData.status !== 'success') {
      return {
        success: false,
        message: `Payment ${paymentData.status}. Transaction ID: ${paymentData.txnid}`,
      };
    }

    // Calculate expiry date (30 days from now)
    const vipExpiresAt = calculateVipExpiryDate();

    // Update user VIP status with expiry date
    try {
      const updatedUser = await updateUserStatus(userId, {
        isVip: true,
        isPremium: true, // VIP includes premium
        vipExpiresAt,
      });

      return {
        success: true,
        message: `Payment verified successfully. Your VIP subscription is now active until ${vipExpiresAt.toLocaleDateString()}!`,
        payment: {
          orderId: paymentData.txnid,
          paymentId: paymentData.txnid, // PayU uses txnid as the transaction identifier
        },
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isVip: updatedUser.isVip ?? false,
          isPremium: updatedUser.isPremium ?? false,
          vipExpiresAt: updatedUser.vipExpiresAt ?? null,
        },
      };
    } catch (error) {
      console.error('Database update error during payment verification:', error);
      return {
        success: false,
        message: 'Payment verified but failed to update subscription. Please contact support.',
      };
    }
  } catch (error) {
    console.error('PayU payment verification error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
};

/**
 * Validate payment amount before creating order
 * @param amount Amount in rupees
 */
export const validatePaymentRequest = (amount: number): void => {
  validatePaymentAmount(amount);
};

