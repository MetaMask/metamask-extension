export const PAYMENT_METHODS = {
  TOKEN: 'token',
  CARD: 'card',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
