import { SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';

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
