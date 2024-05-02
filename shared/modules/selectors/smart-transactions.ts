import type { Hex } from '@metamask/utils';
import {
  ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS,
  SKIP_STX_RPC_URL_CHECK_CHAIN_IDS,
} from '../../constants/smartTransactions';
import { ENVIRONMENT } from '../../../development/build/constants';
import {
  getCurrentChainId,
  getCurrentNetwork,
  accountSupportsSmartTx,
} from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.

type SmartTransactionsMetaMaskState = {
  metamask: {
    preferences: {
      smartTransactionsOptInStatus: boolean | null;
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
        ethereum: {
          extensionActive: boolean;
          mobileActive: boolean;
          smartTransactions: {
            expectedDeadline?: number;
            maxDeadline?: number;
            returnTxHashAsap?: boolean;
          };
        };
        smartTransactions: {
          extensionActive: boolean;
          mobileActive: boolean;
        };
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
  return state.metamask.preferences?.smartTransactionsOptInStatus;
};

export const getCurrentChainSupportsSmartTransactions = (
  state: SmartTransactionsMetaMaskState,
): boolean => {
  const chainId = getCurrentChainId(state);
  return ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId);
};

const getIsAllowedRpcUrlForSmartTransactions = (
  state: SmartTransactionsMetaMaskState,
) => {
  const chainId = getCurrentChainId(state);
  const isDevelopment =
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING;
  if (isDevelopment || SKIP_STX_RPC_URL_CHECK_CHAIN_IDS.includes(chainId)) {
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

export const getIsSmartTransactionsOptInModalAvailable = (
  state: SmartTransactionsMetaMaskState,
) => {
  return (
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
