import { PaymentProvider } from '@prisma/client';

export type CreateCheckoutInput = {
  paymentId: string;
  invoiceNumber: string;
  courseTitle: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CheckoutSessionResult = {
  id: string;
  url: string | null;
};

export type RefundInput = {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
};

export type RefundResult = {
  id: string;
  status: string;
};

/**
 * Future-ready payment provider contract.
 * Stripe implements this today; PayPal / Apple Pay / Google Pay / ZainCash / QiCard can plug in later.
 */
export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  readonly enabled: boolean;
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSessionResult>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
