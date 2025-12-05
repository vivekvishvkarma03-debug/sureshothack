'use server';

/**
 * PayU Utility Functions
 * Centralized configuration and helper functions for PayU integration
 */

import crypto from 'crypto';
import type {
  PayUOrderCreateOptions,
  PayUOrderResponse,
  PayUVerifyRequest,
} from '@/lib/types/payu';

/**
 * Get PayU merchant key from environment variables
 * @throws {Error} If PayU credentials are not configured
 */
export const getPayUMerchantKey = (): string => {
  const key = process.env.PAYU_MERCHANT_KEY;

  if (!key) {
    throw new Error(
      'PayU credentials are not configured. Please set PAYU_MERCHANT_KEY environment variable.'
    );
  }

  return key;
};

/**
 * Get PayU merchant salt from environment variables
 * @throws {Error} If PayU credentials are not configured
 */
export const getPayUMerchantSalt = (): string => {
  const salt = process.env.PAYU_MERCHANT_SALT;

  if (!salt) {
    throw new Error(
      'PayU credentials are not configured. Please set PAYU_MERCHANT_SALT environment variable.'
    );
  }

  return salt;
};

/**
 * Get PayU public key (merchant key) for frontend
 * @throws {Error} If PayU key is not configured
 */
export const getPayUPublicKey = (): string => {
  const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY || process.env.PAYU_MERCHANT_KEY;

  if (!key) {
    throw new Error(
      'PayU merchant key is not configured. Please set NEXT_PUBLIC_PAYU_MERCHANT_KEY environment variable.'
    );
  }

  return key;
};

/**
 * Generate PayU hash for order creation
 * @param txnid Transaction ID
 * @param amount Amount in rupees
 * @param productinfo Product information
 * @param firstname Customer first name
 * @param email Customer email
 * @param salt Merchant salt
 * @returns Generated hash
 */
export const generatePayUHash = (
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  salt: string
): string => {
  const hashString = `${salt}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
};

/**
 * Create a PayU order
 * @param options Order creation options
 * @returns PayU order response
 */
export const createPayUOrder = async (
  options: PayUOrderCreateOptions
): Promise<PayUOrderResponse> => {
  const key = getPayUMerchantKey();
  const salt = getPayUMerchantSalt();

  // Validate amount (minimum ₹1)
  if (!options.amount || options.amount < 1) {
    throw new Error('Invalid amount. Minimum amount is ₹1');
  }

  // Generate unique transaction ID
  const txnid = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate hash
  const hash = generatePayUHash(
    txnid,
    options.amount.toString(),
    options.productinfo || 'VIP Subscription - 30 Days',
    options.firstname,
    options.email,
    salt
  );

  const successUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`
    : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/payments/verify`;

  const failureUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/payments/failure`
    : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/payments/failure`;

  return {
    txnid,
    amount: options.amount,
    currency: options.currency || 'INR',
    productinfo: options.productinfo || 'VIP Subscription - 30 Days',
    firstname: options.firstname,
    email: options.email,
    phone: options.phone,
    hash,
    key,
    surl: successUrl,
    furl: failureUrl,
    service_provider: 'payu_paisa',
    ...(options.udf1 && { udf1: options.udf1 }),
    ...(options.udf2 && { udf2: options.udf2 }),
    ...(options.udf3 && { udf3: options.udf3 }),
    ...(options.udf4 && { udf4: options.udf4 }),
    ...(options.udf5 && { udf5: options.udf5 }),
  };
};

/**
 * Verify PayU payment signature
 * @param request Payment verification request
 * @param salt Merchant salt
 * @returns True if signature is valid, false otherwise
 */
export const verifyPayUSignature = (
  request: PayUVerifyRequest,
  salt: string
): boolean => {
  const { txnid, amount, productinfo, firstname, email, status, hash } = request;

  if (!txnid || !amount || !productinfo || !firstname || !email || !status || !hash) {
    return false;
  }

  // Generate expected hash: salt|status|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = `${salt}|${status}||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${getPayUMerchantKey()}`;
  const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  // Compare hashes using constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hash)
    );
  } catch {
    return false;
  }
};

/**
 * Validate payment amount
 * @param amount Amount in rupees
 * @returns True if valid, throws error if invalid
 */
export const validatePaymentAmount = (amount: number): boolean => {
  if (!amount || typeof amount !== 'number') {
    throw new Error('Amount is required and must be a number');
  }

  if (amount < 1) {
    throw new Error('Minimum payment amount is ₹1');
  }

  if (amount > 1000000) {
    throw new Error('Maximum payment amount is ₹10,00,000');
  }

  return true;
};
