/**
 * Payment Service
 * Handles payment-related business logic
 */

import { verifyRazorpaySignature, validatePaymentAmount } from '@/lib/utils/razorpay';
import { updateUserStatus } from './userService';
import type { RazorpayVerifyRequest } from '@/lib/types/razorpay';

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
 * Verify payment and update user VIP status with 30-day expiry
 * @param userId User ID
 * @param paymentData Payment verification data
 * @returns Payment verification result
 */
export const verifyPaymentAndUpdateUser = async (
  userId: string,
  paymentData: RazorpayVerifyRequest
): Promise<PaymentVerificationResult> => {
  // Verify Razorpay signature
  const isSignatureValid = verifyRazorpaySignature(paymentData);

  if (!isSignatureValid) {
    return {
      success: false,
      message: 'Invalid payment signature',
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
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id,
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
};

/**
 * Validate payment amount before creating order
 * @param amount Amount in paise
 */
export const validatePaymentRequest = (amount: number): void => {
  validatePaymentAmount(amount);
};

