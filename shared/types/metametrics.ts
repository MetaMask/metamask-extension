import type { Provider } from '@metamask/network-controller';
import type { FetchGasFeeEstimateOptions } from '@metamask/gas-fee-controller';
import type { SmartTransaction } from '@metamask/smart-transactions-controller/dist/types';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from 'viem';
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
  getIsSmartTransaction: () => boolean;
  getSmartTransactionByMinedTxHash: (
    txhash: string | undefined,
  ) => SmartTransaction;
  getMethodData: (data: string) => Promise<{ name: string }>;
  getIsConfirmationAdvancedDetailsOpen: () => boolean;
  getHDEntropyIndex: () => number;
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
