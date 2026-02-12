import type { Provider } from '@metamask/network-controller';
import type { FetchGasFeeEstimateOptions } from '@metamask/gas-fee-controller';
import type { SmartTransaction } from '@metamask/smart-transactions-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from 'viem';
import {
  PaymentType,
  RecurringInterval,
  SubscriptionStatus,
} from '@metamask/subscription-controller';
import type {
  MetaMetricsEventFragment,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../constants/metametrics';
import type { TokenStandard } from '../constants/transaction';
import type { HardwareKeyringType } from '../constants/hardware-wallets';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { SnapAndHardwareMessenger } from '../../app/scripts/lib/snap-keyring/metrics';
import { ShieldMetricsSourceEnum } from '../constants/subscriptions';
import type { ScanAddressResponse } from '../lib/trust-signals';

export type TransactionMetricsRequest = {
  createEventFragment: (
    options: Omit<MetaMetricsEventFragment, 'id'>,
  ) => MetaMetricsEventFragment;
  finalizeEventFragment: (
    fragmentId: string,
    options?: {
      abandoned?: boolean;
      page?: MetaMetricsPageObject;
      referrer?: MetaMetricsReferrerObject;
    },
  ) => void;
  getEventFragmentById: (fragmentId: string) => MetaMetricsEventFragment;
  updateEventFragment: (
    fragmentId: string,
    payload: Partial<MetaMetricsEventFragment>,
  ) => void;
  getAccountBalance: (account: Hex, chainId: Hex) => Hex;
  getAccountType: (
    address: string,
  ) => Promise<'hardware' | 'imported' | 'MetaMask'>;
  getDeviceModel: (
    address: string,
  ) => Promise<'ledger' | 'lattice' | 'N/A' | string>;
  getHardwareTypeForMetric: (address: string) => Promise<HardwareKeyringType>;
  // According to the type GasFeeState returned from getEIP1559GasFeeEstimates
  // doesn't include some properties used in buildEventFragmentProperties,
  // hence returning any here to avoid type errors.
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEIP1559GasFeeEstimates(options?: FetchGasFeeEstimateOptions): Promise<any>;
  getParticipateInMetrics: () => boolean;
  getSelectedAddress: () => string;
  getTokenStandardAndDetails: () => Promise<{
    decimals?: string;
    balance?: string;
    symbol?: string;
    standard?: TokenStandard;
  }>;
  getTransaction: (transactionId: string) => TransactionMeta;
  provider: Provider;
  snapAndHardwareMessenger: SnapAndHardwareMessenger;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackEvent: (payload: any) => void;
  getIsSmartTransaction: (chainId: Hex) => boolean;
  getSmartTransactionByMinedTxHash: (
    txhash: string | undefined,
  ) => SmartTransaction;
  getMethodData: (data: string) => Promise<{ name: string }>;
  getIsConfirmationAdvancedDetailsOpen: () => boolean;
  getHDEntropyIndex: () => number;
  getNetworkRpcUrl: (chainId: Hex) => string;
  getFeatureFlags: () => Record<string, unknown>;
  getPna25Acknowledged: () => boolean;
  getAddressSecurityAlertResponse: (
    cacheKey: string,
  ) => ScanAddressResponse | undefined;
  getSecurityAlertsEnabled: () => boolean;
};

export type TransactionEventPayload = {
  transactionMeta: TransactionMeta;
  actionId?: string;
  error?: string;
};

export type TransactionMetaEventPayload = TransactionMeta & {
  actionId?: string;
  error?: string;
};

/**
 * The default options provided to the user in the UI.
 */
export type DefaultSubscriptionPaymentOptions = {
  defaultBillingInterval: RecurringInterval;
  defaultPaymentType: PaymentType;
  defaultPaymentCurrency: string;
  defaultPaymentChain?: string;
};

/**
 * Some properties for the Shield subscription metrics that are not accessible in the background, hence provided from the UI.
 */
export type ShieldSubscriptionMetricsPropsFromUI = {
  userBalanceInUSD: number;
  source: ShieldMetricsSourceEnum;
  rewardPoints?: number;
  marketingUtmParams?: Record<string, string>;
};

export type ExistingSubscriptionEventParams = {
  /**
   * Current subscription status before restarting the subscription. (e.g. cancelled, expired, etc.)
   */
  subscriptionStatus: SubscriptionStatus;

  /**
   * The payment type used for the previous subscription.
   */
  paymentType: PaymentType;

  /**
   * The billing interval used for the previous subscription.
   */
  billingInterval: RecurringInterval;

  /**
   * The crypto payment chain used for the previous subscription.
   */
  cryptoPaymentChain?: string;

  /**
   * The crypto payment currency used for the previous subscription.
   */
  cryptoPaymentCurrency?: string;
};

/**
 * Capture the event when the payment method is changed whilst the membership is active.
 */
export type CaptureShieldPaymentMethodChangeEventParams =
  ExistingSubscriptionEventParams & {
    newPaymentType: PaymentType;
    newBillingInterval: RecurringInterval;
    newPaymentCurrency: string;
    newCryptoPaymentChain?: string;
    changeStatus: 'succeeded' | 'failed';
    errorMessage?: string;
  };
