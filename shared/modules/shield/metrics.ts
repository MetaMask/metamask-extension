import {
  BALANCE_CATEGORIES,
  BalanceCategory,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RecurringInterval,
  Subscription,
  SubscriptionControllerState,
  SubscriptionStatus,
} from '@metamask/subscription-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringObject } from '@metamask/keyring-controller';
import { Json } from '@metamask/utils';
import {
  EntryModalSourceEnum,
  ShieldUserAccountCategoryEnum,
  ShieldUserAccountTypeEnum,
} from '../../constants/subscriptions';
import { getShieldSubscription } from '../../lib/shield';
import { KeyringType } from '../../constants/keyring';
import {
  DefaultSubscriptionPaymentOptions,
  ShieldSubscriptionMetricsPropsFromUI,
} from '../../types';
// eslint-disable-next-line import/no-restricted-paths
import {
  getDefaultSubscriptionPaymentOptions,
  getIsTrialedSubscription,
} from './shield';

export function getBillingIntervalForMetrics(interval: RecurringInterval) {
  // TODO: Looks Odd, update the segment schema maybe?
  return interval === 'month' ? 'monthly' : 'yearly';
}

export function getBillingCyclesForMetrics(interval: RecurringInterval) {
  return interval === 'month' ? '12' : '1';
}

export function getLatestSubscriptionStatus(
  subscriptions: Subscription[],
  lastSubscription: Subscription | undefined,
): SubscriptionStatus | undefined {
  const currentShieldSubscription = getShieldSubscription(subscriptions);
  return currentShieldSubscription?.status || lastSubscription?.status;
}

export function getUserAccountType(
  account: InternalAccount | null,
): ShieldUserAccountTypeEnum {
  if (account?.type === 'eip155:eoa') {
    return ShieldUserAccountTypeEnum.EOA;
  } else if (account?.type === 'eip155:erc4337') {
    return ShieldUserAccountTypeEnum.ERC4337;
  }
  return ShieldUserAccountTypeEnum.OTHER;
}

export function getUserAccountCategory(
  account: InternalAccount | null,
  keyringsMetadata: KeyringObject[],
): ShieldUserAccountCategoryEnum {
  const entropySource = account?.options?.entropySource;
  const isHdKeyringAccount =
    account?.metadata?.keyring?.type === KeyringType.hdKeyTree;

  if (entropySource && isHdKeyringAccount) {
    const keyringIndex = keyringsMetadata.findIndex(
      (keyring) => keyring.metadata.id === entropySource,
    );
    if (keyringIndex === 0) {
      return ShieldUserAccountCategoryEnum.PRIMARY;
    } else if (keyringIndex > 0) {
      return ShieldUserAccountCategoryEnum.ImportedWallet;
    }
  }
  return ShieldUserAccountCategoryEnum.ImportedAccount;
}

/**
 * Converts a balance in USD to a balance category
 *
 * @param balanceInUSD - The balance in USD
 * @returns The balance category string
 */
export function getUserBalanceCategory(balanceInUSD: number): BalanceCategory {
  if (balanceInUSD >= 1000000) {
    return BALANCE_CATEGORIES.RANGE_1M_PLUS;
  }
  if (balanceInUSD >= 100000) {
    return BALANCE_CATEGORIES.RANGE_100K_999_9K;
  }
  if (balanceInUSD >= 10000) {
    return BALANCE_CATEGORIES.RANGE_10K_99_9K;
  }
  if (balanceInUSD >= 1000) {
    return BALANCE_CATEGORIES.RANGE_1K_9_9K;
  }
  if (balanceInUSD >= 100) {
    return BALANCE_CATEGORIES.RANGE_100_999;
  }
  return BALANCE_CATEGORIES.RANGE_0_99;
}

export function getUserAccountTypeAndCategory(
  account: InternalAccount | null,
  keyringsMetadata: KeyringObject[],
) {
  const userAccountType = getUserAccountType(account);
  const userAccountCategory = getUserAccountCategory(account, keyringsMetadata);
  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    user_account_type: userAccountType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    user_account_category: userAccountCategory,
  };
}

/**
 * Get the common tracking props for the Shield metrics.
 *
 * @param account - The account.
 * @param keyringsMetadata - The keyrings metadata.
 * @param balanceInUSD - The balance in USD.
 * @returns The common tracking props.
 */
export function getShieldCommonTrackingProps(
  account: InternalAccount | null,
  keyringsMetadata: KeyringObject[],
  balanceInUSD: number,
) {
  return {
    ...getUserAccountTypeAndCategory(account, keyringsMetadata),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    multi_chain_balance_category: getUserBalanceCategory(balanceInUSD),
  };
}

/**
 * Get the tracking props for the subscription request for the Shield metrics.
 *
 * @param subscriptionControllerState - The subscription controller state.
 * @param defaultSubscriptionPaymentOptions - The default subscription payment options.
 * @param shieldSubscriptionMetricsProps - The Shield subscription metrics properties.
 * @param transactionMeta
 * @returns The tracking props.
 */
export function getSubscriptionRequestTrackingProps(
  subscriptionControllerState: SubscriptionControllerState,
  defaultSubscriptionPaymentOptions?: DefaultSubscriptionPaymentOptions,
  shieldSubscriptionMetricsProps?: ShieldSubscriptionMetricsPropsFromUI,
  transactionMeta?: TransactionMeta,
): Record<string, Json> {
  const {
    lastSelectedPaymentMethod,
    trialedProducts,
    subscriptions,
    lastSubscription,
  } = subscriptionControllerState;

  if (!lastSelectedPaymentMethod?.shield) {
    // This should never happen, since this function is only called after the user has selected a payment method for the Shield subscription
    throw new Error('Last selected payment method is not set');
  }

  const {
    defaultBillingInterval,
    defaultPaymentType,
    defaultPaymentCurrency,
    defaultPaymentChain,
  } = getDefaultSubscriptionPaymentOptions(defaultSubscriptionPaymentOptions);

  const billingInterval = getBillingIntervalForMetrics(
    lastSelectedPaymentMethod.shield.plan,
  );
  const billingCycles = getBillingCyclesForMetrics(
    lastSelectedPaymentMethod.shield.plan,
  );
  const isTrialed = getIsTrialedSubscription(
    trialedProducts,
    PRODUCT_TYPES.SHIELD,
  );
  const paymentChain = transactionMeta?.chainId;

  const latestSubscriptionStatus =
    getLatestSubscriptionStatus(subscriptions, lastSubscription) || 'none';

  return {
    ...(shieldSubscriptionMetricsProps?.marketingUtmParams || {}),
    source:
      shieldSubscriptionMetricsProps?.source || EntryModalSourceEnum.Settings,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    marketing_utm_id: shieldSubscriptionMetricsProps?.marketingUtmId || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    multi_chain_balance_category: getUserBalanceCategory(
      shieldSubscriptionMetricsProps?.userBalanceInUSD ?? 0,
    ),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subscription_state: latestSubscriptionStatus,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_type: defaultPaymentType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_currency: defaultPaymentCurrency,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_payment_chain: defaultPaymentChain || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    default_billing_interval: getBillingIntervalForMetrics(
      defaultBillingInterval,
    ),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_type:
      lastSelectedPaymentMethod.shield.type || PAYMENT_TYPES.byCrypto,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_currency:
      lastSelectedPaymentMethod.shield.paymentTokenSymbol ||
      defaultPaymentCurrency,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    billing_interval: billingInterval,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    billing_cycles: billingCycles,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    payment_chain: paymentChain || null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_trial: !isTrialed,
  };
}

/**
 * Get the marketing UTM parameters for the Shield metrics from the url search parameters.
 *
 * @param search - The search parameters.
 * @returns The marketing UTM parameters.
 */
export function getShieldMarketingUtmParamsForMetrics(search: string) {
  const searchParams = new URLSearchParams(search);

  const marketingUtmParams: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key.startsWith('utm_')) {
      marketingUtmParams[key] = value;
    }
  });
  return marketingUtmParams;
}
