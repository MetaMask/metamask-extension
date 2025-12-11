import { SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';
import { CURRENCY_SYMBOLS } from './network';

export const ActiveSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.active,
  SUBSCRIPTION_STATUSES.trialing,
  SUBSCRIPTION_STATUSES.provisional,
];

export const PausedSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.paused,
  SUBSCRIPTION_STATUSES.pastDue,
  SUBSCRIPTION_STATUSES.unpaid,
];

export const SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS = 14;

export const SUBSCRIPTION_DEFAULT_PAYMENT_TOKEN = 'mUSD';

export const SUPPORTED_PAYMENT_TOKEN_IMAGES: Record<string, string> = {
  [CURRENCY_SYMBOLS.USDC]:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  [CURRENCY_SYMBOLS.USDT]:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
  [SUBSCRIPTION_DEFAULT_PAYMENT_TOKEN]:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xaca92e438df0b2401ff60da7e4337b687a2435da.png',
};

/**
 * The source where the Shield entry modal is triggered from
 */
export enum EntryModalSourceEnum {
  Notification = 'notification',
  Carousel = 'carousel',
  Homepage = 'homepage',
  Settings = 'settings',
  Marketing = 'marketing', // from marketing campaign
  PostTransaction = 'post_transaction', // after a transaction
}

export enum ShieldCtaSourceEnum {
  Notification = 'notification',
  Carousel = 'carousel',
  Homepage = 'homepage',
  Settings = 'settings',
  Marketing = 'marketing', // from marketing campaign
  PostTransaction = 'post_transaction', // after a transaction
}

export enum ShieldUserAccountCategoryEnum {
  PRIMARY = 'primary',
  ImportedAccount = 'imported_account',
  ImportedWallet = 'imported_wallet',
}

export enum ShieldUserAccountTypeEnum {
  EOA = 'EOA',
  ERC4337 = 'SmartAccount',
  // in case user current selected account could be non evm like bitcoin, solana
  OTHER = 'Other',
}

export enum ShieldSubscriptionRequestSubscriptionStateEnum {
  New = 'new',
  Renew = 'renew',
}

export enum ShieldCtaActionClickedEnum {
  Start14DayTrial = 'start_14_day_free_trial',
  LearnMore = 'learn_more',
  TermOfUse = 'term_of_use',
  ViewFullBenefits = 'view_full_benefits',
  ContactSupport = 'contact_support',
  WhatsCovered = 'whats_covered',
  FindingTxHash = 'finding_tx_hash',
  Dismiss = 'dismiss',
}

export enum ShieldErrorStateActionClickedEnum {
  Cta = 'cta',
  Dismiss = 'dismiss',
}

export enum ShieldErrorStateLocationEnum {
  Homepage = 'homepage',
  Settings = 'settings',
}

export enum ShieldErrorStateViewEnum {
  Banner = 'banner',
  Toast = 'toast',
}

export enum ShieldUnexpectedErrorEventLocationEnum {
  TransactionShieldTab = 'transaction_shield_tab',
  ShieldPlanPage = 'shield_plan_page',
  Other = 'other',
}
