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
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringObject } from '@metamask/keyring-controller';
import { Json } from '@metamask/utils';
import {
  ShieldUserAccountCategoryEnum,
  ShieldUserAccountTypeEnum,
} from '../../constants/subscriptions';
import { getShieldSubscription } from '../../lib/shield';
import { KeyringType } from '../../constants/keyring';
import { DefaultSubscriptionPaymentOptions } from '../../types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../constants/metametrics';
// eslint-disable-next-line import/no-restricted-paths
import MetaMetricsController from '../../../app/scripts/controllers/metametrics-controller';
import {
  getDefaultSubscriptionPaymentOptions,
  getIsTrialSubscription,
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

/**
 * Get the tracking props for the subscription request for the Shield metrics.
 *
 * @param defaultSubscriptionPaymentOptions - The default subscription payment options.
 * @param subscriptionControllerState - The subscription controller state.
 * @param transactionMeta
 * @returns The tracking props.
 */
export function getSubscriptionRequestTrackingProps(
  defaultSubscriptionPaymentOptions: DefaultSubscriptionPaymentOptions,
  subscriptionControllerState: SubscriptionControllerState,
  transactionMeta: TransactionMeta,
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
  const isTrialed = getIsTrialSubscription(
    trialedProducts,
    PRODUCT_TYPES.SHIELD,
  );
  const paymentChain = transactionMeta.chainId;

  const latestSubscriptionStatus =
    getLatestSubscriptionStatus(subscriptions, lastSubscription) || 'none';

  return {
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
    payment_chain: paymentChain,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_trial: isTrialed,
  };
}

export function getUserAccountType(
  account: InternalAccount,
): ShieldUserAccountTypeEnum {
  if (account.type === 'eip155:eoa') {
    return ShieldUserAccountTypeEnum.EOA;
  } else if (account.type === 'eip155:erc4337') {
    return ShieldUserAccountTypeEnum.ERC4337;
  }
  // Shield is currently only supported for EVM accounts, so this should never happen
  throw new Error('Unsupported account type');
}

export function getUserAccountCategory(
  account: InternalAccount,
  keyringsMetadata: KeyringObject[],
): ShieldUserAccountCategoryEnum {
  const entropySource = account.options?.entropySource;
  const isHdKeyringAccount =
    account.metadata.keyring.type === KeyringType.hdKeyTree;

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
  account: InternalAccount,
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
 * Capture a Shield subscription request event with crypto payment.
 *
 * @param subscriptionControllerState - The subscription controller state.
 * @param transactionMeta - The transaction meta.
 * @param defaultSubscriptionPaymentOptions - The default subscription payment options.
 * @param metaMetricsController - The meta metrics controller.
 * @param requestStatus - The request status.
 * @param extrasProps - The extra properties.
 */
export function captureShieldSubscriptionRequestEvent(
  subscriptionControllerState: SubscriptionControllerState,
  transactionMeta: TransactionMeta,
  defaultSubscriptionPaymentOptions: DefaultSubscriptionPaymentOptions,
  metaMetricsController: MetaMetricsController,
  requestStatus: 'started' | 'completed' | 'failed',
  extrasProps: Record<string, Json>,
) {
  if (transactionMeta.type !== TransactionType.shieldSubscriptionApprove) {
    return;
  }

  const trackingProps = getSubscriptionRequestTrackingProps(
    defaultSubscriptionPaymentOptions,
    subscriptionControllerState,
    transactionMeta,
  );

  metaMetricsController.trackEvent({
    event: MetaMetricsEventName.ShieldSubscriptionRequest,
    category: MetaMetricsEventCategory.Shield,
    properties: {
      ...trackingProps,
      ...extrasProps,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      status: requestStatus,
    },
  });
}
