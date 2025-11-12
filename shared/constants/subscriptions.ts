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

export enum ShieldEntryModalTypeEnum {
  TypeA = 'type_a',
  TypeB = 'type_b',
}

export enum ShieldUserBalanceRangeCategoryEnum {
  LessThan100 = '<100',
  Between100And1K = '100-1k',
  Between1KAnd10K = '1k-10k',
  Between10KAnd100K = '10k-100k',
  MoreThan100K = '>100k',
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
