import { Hex } from '@metamask/utils';
import { getNetworkNameByChainId } from '../feature-flags';
import { ProviderConfigState, getCurrentChainId } from './networks';

type NetworkFeatureFlag = {
  extensionActive: boolean;
  mobileActive: boolean;
  smartTransactions?: {
    mobileActive?: boolean;
    extensionActive?: boolean;
    expectedDeadline?: number;
    maxDeadline?: number;
    extensionReturnTxHashAsap?: boolean;
  };
};

type SmartTransactionsFeatureFlag = {
  mobileActive: boolean;
  extensionActive: boolean;
  extensionReturnTxHashAsap: boolean;
};

export type SwapsFeatureFlags = {
  [networkName: string]: NetworkFeatureFlag;
  smartTransactions: SmartTransactionsFeatureFlag;
};

export type SmartTransactionNetwork = {
  extensionActive?: boolean;
  sentinelUrl?: string;
  extensionReturnTxHashAsap?: boolean;
  batchStatusPollingInterval?: number;
};

export type SmartTransactionsNetworks = {
  [chainId: Hex]: SmartTransactionNetwork | undefined;
  default?: SmartTransactionNetwork;
};

export type FeatureFlagsMetaMaskState = {
  metamask: {
    swapsState: {
      swapsFeatureFlags: SwapsFeatureFlags;
    };
    remoteFeatureFlags?: {
      smartTransactionsNetworks?: SmartTransactionsNetworks;
    };
  };
};

export function getFeatureFlagsByChainId(
  state: ProviderConfigState & FeatureFlagsMetaMaskState,
  chainId?: string,
) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveChainId = chainId || getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(effectiveChainId);
  const featureFlags = state.metamask.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  const smartTransactionsNetworks =
    state.metamask.remoteFeatureFlags?.smartTransactionsNetworks;
  const defaultConfig = smartTransactionsNetworks?.default;
  const extensionReturnTxHashAsap =
    defaultConfig?.extensionReturnTxHashAsap ?? false;

  return {
    smartTransactions: {
      ...featureFlags.smartTransactions,
      ...featureFlags[networkName].smartTransactions,
      extensionReturnTxHashAsap,
    },
  };
}
