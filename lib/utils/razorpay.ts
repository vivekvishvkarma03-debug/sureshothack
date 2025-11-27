/**
 * Razorpay Utility Functions
 * Centralized configuration and helper functions for Razorpay integration
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import type {
  RazorpayOrderCreateOptions,
  RazorpayOrderResponse,
  RazorpayVerifyRequest,
} from '@/lib/types/razorpay';

/**
 * Get Razorpay instance with credentials from environment variables
 * @throws {Error} If Razorpay credentials are not configured
 */
export const getRazorpayInstance = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * Get Razorpay public key ID for frontend
 * @throws {Error} If Razorpay key ID is not configured
 */
export const getRazorpayKeyId = (): string => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error(
      'Razorpay key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable.'
    );
  }

  return keyId;
};

/**
 * Create a Razorpay order
 * @param options Order creation options
 * @returns Razorpay order response
 */
export const createRazorpayOrder = async (
  options: RazorpayOrderCreateOptions
): Promise<RazorpayOrderResponse> => {
  const razorpay = getRazorpayInstance();

  // Validate amount (minimum ₹1 = 100 paise)
  if (!options.amount || options.amount < 100) {
    throw new Error('Invalid amount. Minimum amount is ₹1 (100 paise)');
  }

  // Set defaults
  const orderOptions = {
    amount: options.amount,
    currency: options.currency || 'INR',
    receipt: options.receipt || `receipt_${Date.now()}`,
    notes: options.notes || {},
  };

  try {
    const order = await razorpay.orders.create(orderOptions);

    // Razorpay returns amount as number, but TypeScript types it as string | number
    // Convert to number to ensure type safety
    const amount = typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount;

    return {
      id: order.id,
      amount,
      currency: order.currency,
      receipt: order.receipt || `receipt_${Date.now()}`, // Provide default if undefined
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to create Razorpay order: ${error.message}`
        : 'Failed to create Razorpay order'
    );
  }
};

/**
 * Verify Razorpay payment signature
 * @param request Payment verification request
 * @returns True if signature is valid, false otherwise
 */
export const verifyRazorpaySignature = (
  request: RazorpayVerifyRequest
): boolean => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay key secret is not configured');
  }

  // Generate signature
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');

  // Compare signatures using constant-time comparison
  // Both signatures should be the same length (64 hex characters for SHA256)
  if (generatedSignature.length !== razorpay_signature.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );
  } catch {
    return false;
  }
};

/**
 * Validate payment amount
 * @param amount Amount in paise
 * @returns True if valid, throws error if invalid
 */
export const validatePaymentAmount = (amount: number): boolean => {
  if (!amount || typeof amount !== 'number') {
    throw new Error('Amount is required and must be a number');
  }

  if (amount < 100) {
    throw new Error('Minimum payment amount is ₹1 (100 paise)');
  }

  if (amount > 100000000) {
    throw new Error('Maximum payment amount is ₹10,00,000 (100000000 paise)');
  }

  return true;
};

