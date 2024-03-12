import { ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS } from '../constants/smartTransactions';
import { ENVIRONMENT } from '../../development/build/constants';
import {
  getCurrentChainId,
  getCurrentNetwork,
  accountSupportsSmartTx,
} from '../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import { getNetworkNameByChainId } from './feature-flags';

export const getSmartTransactionsOptInStatus = (
  state: Record<string, any>,
): boolean | null => {
  return state.metamask.preferences?.stxOptIn;
};

export const getIsAllowedStxChainId = (state: Record<string, any>): boolean => {
  const chainId = getCurrentChainId(state);
  return ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId);
};

const getIsAllowedRpcUrlForStx = (state: Record<string, any>) => {
  const isNotDevelopment =
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.DEVELOPMENT &&
    process.env.METAMASK_ENVIRONMENT !== ENVIRONMENT.TESTING;
  if (!isNotDevelopment) {
    return true; // Allow any STX RPC URL in development and testing environments.
  }
  const currentNetwork = getCurrentNetwork(state);
  if (!currentNetwork?.rpcUrl) {
    return false;
  }
  const rpcUrl = new URL(currentNetwork.rpcUrl);
  // Only allow STX in prod if an Infura RPC URL is being used.
  return rpcUrl?.hostname?.endsWith('.infura.io');
};

export const getIsStxOptInAvailable = (state: Record<string, any>) => {
  return getIsAllowedStxChainId(state) && getIsAllowedRpcUrlForStx(state);
};

export const getSmartTransactionsEnabled = (
  state: Record<string, any>,
): boolean => {
  const supportedAccount = accountSupportsSmartTx(state);
  // TODO: Create a new proxy service only for MM feature flags.
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    getIsStxOptInAvailable(state) &&
      supportedAccount &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getIsSmartTransaction = (state: Record<string, any>): boolean => {
  const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  return Boolean(smartTransactionsOptInStatus && smartTransactionsEnabled);
};

export function getFeatureFlagsByChainId(state: Record<string, any>) {
  const chainId = getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(chainId);
  const featureFlags = state.metamask.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  return {
    smartTransactions: {
      ...featureFlags[networkName].smartTransactions,
      ...featureFlags.smartTransactions,
    },
  };
}

const sharedSelectors = {
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getIsSmartTransaction,
  getIsAllowedStxChainId,
  getFeatureFlagsByChainId,
  getIsStxOptInAvailable,
};

export default sharedSelectors;
