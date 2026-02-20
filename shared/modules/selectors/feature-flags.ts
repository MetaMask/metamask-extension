import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../constants/network';
import {
  ARBITRUM,
  AVALANCHE,
  BASE,
  BSC,
  ETHEREUM,
  GOERLI,
  LINEA,
  OPTIMISM,
  POLYGON,
  SEI,
  ZKSYNC_ERA,
} from '../../constants/swaps';
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
  extensionReturnTxHashAsapBatch?: boolean;
  extensionSkipSmartTransactionStatusPage?: boolean;
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

function getNetworkNameByChainId(chainId: string): string {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
      return ETHEREUM;
    case CHAIN_IDS.BSC:
      return BSC;
    case CHAIN_IDS.POLYGON:
      return POLYGON;
    case CHAIN_IDS.GOERLI:
      return GOERLI;
    case CHAIN_IDS.AVALANCHE:
      return AVALANCHE;
    case CHAIN_IDS.OPTIMISM:
      return OPTIMISM;
    case CHAIN_IDS.ARBITRUM:
      return ARBITRUM;
    case CHAIN_IDS.ZKSYNC_ERA:
      return ZKSYNC_ERA;
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA;
    case CHAIN_IDS.BASE:
      return BASE;
    case CHAIN_IDS.SEI:
      return SEI;
    default:
      return '';
  }
}

/**
 * @param state
 * @param chainId
 * @deprecated Use selectSmartTransactionsFeatureFlagsForChain instead
 * Will be removed in a future release.
 */
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
  const defaultConfig = smartTransactionsNetworks?.default ?? {};
  const chainSpecificConfig =
    smartTransactionsNetworks?.[effectiveChainId as Hex] ?? {};

  // Merge with fallback precedence: chainSpecific > default > hardcoded defaults (false)
  // TODO: this is temporary until we deprecate this file and implement a better flag system.
  const remoteFlags = {
    extensionReturnTxHashAsap:
      chainSpecificConfig.extensionReturnTxHashAsap ??
      defaultConfig.extensionReturnTxHashAsap ??
      false,
    extensionReturnTxHashAsapBatch:
      chainSpecificConfig.extensionReturnTxHashAsapBatch ??
      defaultConfig.extensionReturnTxHashAsapBatch ??
      false,
    extensionSkipSmartTransactionStatusPage:
      chainSpecificConfig.extensionSkipSmartTransactionStatusPage ??
      defaultConfig.extensionSkipSmartTransactionStatusPage ??
      false,
  };

  return {
    smartTransactions: {
      ...featureFlags.smartTransactions,
      ...featureFlags[networkName].smartTransactions,
      ...remoteFlags,
    },
  };
}
