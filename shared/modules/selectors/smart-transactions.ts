import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import {
  accountSupportsSmartTx,
  getCurrentChainId,
  getCurrentNetwork,
} from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import {
  getAllowedSmartTransactionsChainIds,
  SKIP_STX_RPC_URL_CHECK_CHAIN_IDS,
} from '../../constants/smartTransactions';
import { isProduction } from '../environment';
import { compareVersions, parseVersion } from '../../lib/semversion';
import ExtensionPlatform from '../../../app/scripts/platforms/extension';
import { getIsFeatureFlagLoaded } from '../../../ui/ducks/swaps/swaps';
import {
  ChainSpecificFeatureFlags,
  SmartTransactionsFeatureFlags,
  getFeatureFlagsByChainId,
} from './feature-flags';

type SmartTransactionsMetaMaskState = {
  metamask: {
    preferences: {
      smartTransactionsOptInStatus?: boolean | null;
    };
    internalAccounts: {
      selectedAccount: string;
      accounts: {
        [key: string]: {
          metadata: {
            keyring: {
              type: string;
            };
          };
        };
      };
    };
    providerConfig: {
      chainId: Hex;
    };
    swapsState: {
      swapsFeatureFlags: {
        ethereum: ChainSpecificFeatureFlags;
        smartTransactions: SmartTransactionsFeatureFlags;
      };
    };
    smartTransactionsState: {
      liveness: boolean;
    };
    networkConfigurations: {
      [key: string]: {
        chainId: Hex;
        rpcUrl: string;
      };
    };
  };
};

export const getSmartTransactionsOptInStatus = (
  state: SmartTransactionsMetaMaskState,
): boolean | null => {
  return state.metamask.preferences?.smartTransactionsOptInStatus ?? null;
};

export const getCurrentChainSupportsSmartTransactions = (
  state: SmartTransactionsMetaMaskState,
): boolean => {
  const chainId = getCurrentChainId(state);
  return getAllowedSmartTransactionsChainIds().includes(chainId);
};

const getIsAllowedRpcUrlForSmartTransactions = (
  state: SmartTransactionsMetaMaskState,
) => {
  const chainId = getCurrentChainId(state);
  if (!isProduction() || SKIP_STX_RPC_URL_CHECK_CHAIN_IDS.includes(chainId)) {
    // Allow any STX RPC URL in development and testing environments or for specific chain IDs.
    return true;
  }
  const currentNetwork = getCurrentNetwork(state);
  if (!currentNetwork?.rpcUrl) {
    return false;
  }
  const rpcUrl = new URL(currentNetwork.rpcUrl);
  // Only allow STX in prod if an Infura RPC URL is being used.
  return rpcUrl?.hostname?.endsWith('.infura.io');
};

/**
 * Returns true if the current platform version is greater than or equal to the
 * minimum version required to show the smart transaction opt-in modal.
 */
export const getMeetsMinimumVersionToShowOptInModal = createSelector(
  getFeatureFlagsByChainId,
  (featureFlags) => {
    const minVersionStr = featureFlags?.smartTransactions?.optInModalMinVersion;
    const minVer = parseVersion(minVersionStr);
    if (!minVer) {
      return false;
    }
    const version = parseVersion(
      (global.platform as ExtensionPlatform).getVersion(),
    );
    if (!version) {
      return false;
    }
    return compareVersions(version, minVer) >= 0;
  },
);

export const getIsSmartTransactionsOptInModalAvailable = (
  state: SmartTransactionsMetaMaskState,
) => {
  return (
    getIsFeatureFlagLoaded(state) &&
    getMeetsMinimumVersionToShowOptInModal(state) &&
    getCurrentChainSupportsSmartTransactions(state) &&
    getIsAllowedRpcUrlForSmartTransactions(state) &&
    getSmartTransactionsOptInStatus(state) === null
  );
};

export const getSmartTransactionsEnabled = (
  state: SmartTransactionsMetaMaskState,
): boolean => {
  const supportedAccount = accountSupportsSmartTx(state);
  // TODO: Create a new proxy service only for MM feature flags.
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    getCurrentChainSupportsSmartTransactions(state) &&
      getIsAllowedRpcUrlForSmartTransactions(state) &&
      supportedAccount &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getIsSmartTransaction = (
  state: SmartTransactionsMetaMaskState,
): boolean => {
  const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  return Boolean(smartTransactionsOptInStatus && smartTransactionsEnabled);
};
