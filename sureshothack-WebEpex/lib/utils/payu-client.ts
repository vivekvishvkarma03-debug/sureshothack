/**
 * PayU Client-side Utilities
 * Helper functions for PayU integration on the frontend
 */

import type {
  PayUCheckoutOptions,
  PayUPaymentResponse,
} from '@/lib/types/payu';

/**
 * Get PayU public key (merchant key) from environment variables
 * @throws {Error} If PayU merchant key is not configured
 */
export const getPayUMerchantKey = (): string => {
  const key = process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY;

  if (!key) {
    throw new Error(
      'PayU merchant key is not configured. Please set NEXT_PUBLIC_PAYU_MERCHANT_KEY environment variable.'
    );
  }

  return key;
};

/**
 * Check if PayU form is loaded
 */
export const isPayULoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Create and submit PayU form
 * @param options PayU checkout options
 */
export const submitPayUForm = (options: PayUCheckoutOptions): void => {
  if (!isPayULoaded()) {
    throw new Error('PayU environment is not ready. Please try again.');
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://secure.payu.in/_payment';
  form.target = '_blank';

  const fields = {
    key: options.key,
    txnid: options.txnid,
    amount: options.amount.toString(),
    currency: options.currency,
    productinfo: options.productinfo,
    firstname: options.firstname,
    email: options.email,
    phone: options.phone,
    surl: options.surl,
    furl: options.furl,
    hash: options.hash,
    service_provider: options.service_provider || 'payu_paisa',
    ...(options.udf1 && { udf1: options.udf1 }),
    ...(options.udf2 && { udf2: options.udf2 }),
    ...(options.udf3 && { udf3: options.udf3 }),
    ...(options.udf4 && { udf4: options.udf4 }),
    ...(options.udf5 && { udf5: options.udf5 }),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
  }

  document.body.appendChild(form);
  form.submit();
};

/**
 * Default PayU checkout options builder
 */
export const getDefaultPayUOptions = (
  txnid: string,
  amount: number,
  hash: string,
  user?: { fullName?: string; email?: string; phone?: string }
): PayUCheckoutOptions => {
  const surl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`
    : `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}/api/payments/verify`;

  const furl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/payments/failure`
    : `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'}/api/payments/failure`;

  return {
    key: getPayUMerchantKey(),
    txnid,
    amount,
    currency: 'INR',
    productinfo: 'VIP Subscription - 30 Days',
    firstname: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    surl,
    furl,
    hash,
    service_provider: 'payu_paisa',
  };
};

/**
 * Handle PayU payment response from server
 * This is called when PayU redirects to the success/failure URL
 */
export const handlePayUResponse = async (
  responseData: Record<string, any>
): Promise<PayUPaymentResponse> => {
  return {
    txnid: responseData.txnid || '',
    payuMoneyId: responseData.payuMoneyId || responseData.mihpayid || '',
    mode: responseData.mode || '',
    status: responseData.status || 'failure',
    unmappedstatus: responseData.unmappedstatus || '',
    amount: responseData.amount || '',
    cardCategory: responseData.cardCategory || '',
    discount: responseData.discount || '',
    email: responseData.email || '',
    firstname: responseData.firstname || '',
    phone: responseData.phone || '',
    productinfo: responseData.productinfo || '',
    udf1: responseData.udf1,
    udf2: responseData.udf2,
    udf3: responseData.udf3,
    udf4: responseData.udf4,
    udf5: responseData.udf5,
    hash: responseData.hash || '',
    field1: responseData.field1,
    field2: responseData.field2,
    field3: responseData.field3,
    field4: responseData.field4,
    field5: responseData.field5,
    field6: responseData.field6,
    field7: responseData.field7,
    field8: responseData.field8,
    field9: responseData.field9,
  };
};
