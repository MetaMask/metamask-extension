export const PAYMENT_METHODS = {
  TOKEN: 'token',
  CARD: 'card',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// TODO: should come from subscription controller
export const SHIELD_PLAN_PRICES = {
  ANNUAL: '$80',
  MONTHLY: '$8',
} as const;

// TODO: should come from subscription controller
export const PLAN_TYPES = {
  ANNUAL: 'annual',
  MONTHLY: 'monthly',
} as const;

export type Plan = {
  id: (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];
  label: string;
  price: string;
};

export const SUPPORTED_STABLE_TOKENS = ['USDT', 'USDC', 'MUSD'];
