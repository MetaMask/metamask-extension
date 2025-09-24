import { RecurringInterval } from '@metamask/subscription-controller';

export type Plan = {
  id: RecurringInterval;
  label: string;
  price: string;
};

export const SUPPORTED_STABLE_TOKENS = ['USDT', 'USDC', 'DAI'];

export const PAYMENT_METHODS = {
  TOKEN: 'token',
  CARD: 'card',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PLAN_TYPES = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export const SHIELD_PLAN_PRICES = {
  MONTHLY: '$4.99',
  ANNUAL: '$49.99',
} as const;
