/**
 * Razorpay Client-side Utilities
 * Helper functions for Razorpay integration on the frontend
 */

import type {
  RazorpayCheckoutOptions,
  RazorpayPaymentResponse,
  RazorpayInstance,
} from '@/lib/types/razorpay';

/**
 * Get Razorpay public key ID from environment variables
 * @throws {Error} If Razorpay key ID is not configured
 */
export const getRazorpayKeyId = (): string => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error(
      'Razorpay key ID is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable.'
    );
  }

  return keyId;
};

/**
 * Check if Razorpay script is loaded
 */
export const isRazorpayLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
};

/**
 * Create Razorpay checkout instance
 * @param options Razorpay checkout options
 * @returns Razorpay instance
 * @throws {Error} If Razorpay is not loaded or key ID is missing
 */
export const createRazorpayCheckout = (
  options: RazorpayCheckoutOptions
): RazorpayInstance => {
  if (!isRazorpayLoaded()) {
    throw new Error('Razorpay script is not loaded. Please wait for it to load.');
  }

  if (!options.key) {
    options.key = getRazorpayKeyId();
  }

  return new window.Razorpay(options);
};

/**
 * Default Razorpay checkout options
 */
export const getDefaultRazorpayOptions = (
  orderId: string,
  amount: number,
  currency: string,
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>,
  user?: { fullName?: string; email?: string }
): RazorpayCheckoutOptions => {
  return {
    key: getRazorpayKeyId(),
    amount,
    currency,
    name: 'SureShot_Hack',
    description: 'VIP Subscription - 28 Days',
    order_id: orderId,
    handler,
    prefill: {
      name: user?.fullName || '',
      email: user?.email || '',
    },
    theme: {
      color: '#FF6B35',
    },
    modal: {
      ondismiss: () => {
        // Handle modal dismissal if needed
      },
    },
  };
};

