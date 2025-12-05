/**
 * PayU TypeScript Types
 */

export interface PayUOrder {
  txnid: string;
  amount: number;
  currency: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  hash: string;
  surl?: string;
  furl?: string;
  service_provider?: string;
}

export interface PayUOrderCreateOptions {
  amount: number;
  currency?: string;
  productinfo?: string;
  firstname: string;
  email: string;
  phone: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUOrderResponse {
  txnid: string;
  amount: number;
  currency: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  hash: string;
  key: string;
  surl: string;
  furl: string;
  service_provider?: string;
}

export interface PayUPaymentResponse {
  txnid: string;
  payuMoneyId: string;
  mode: string;
  status: 'success' | 'failure' | 'pending';
  unmappedstatus: string;
  amount: string;
  cardCategory: string;
  discount: string;
  email: string;
  firstname: string;
  phone: string;
  productinfo: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  hash: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  field5?: string;
  field6?: string;
  field7?: string;
  field8?: string;
  field9?: string;
}

export interface PayUVerifyRequest {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: 'success' | 'failure' | 'pending';
  hash: string;
  payuMoneyId?: string;
  mode?: string;
}

export interface PayUCheckoutOptions {
  key: string;
  txnid: string;
  amount: number;
  currency: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  service_provider?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUError {
  error: {
    code: string;
    description: string;
    message: string;
  };
}

export interface PayUInstance {
  open: () => void;
  close: () => void;
}
