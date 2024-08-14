import type { Hex } from '@metamask/utils';
import {
  getAllowedSmartTransactionsChainIds,
  SKIP_STX_RPC_URL_CHECK_CHAIN_IDS,
} from '../../constants/smartTransactions';
import {
  getCurrentChainId,
  getCurrentNetwork,
  accountSupportsSmartTx,
  getSelectedAccount,
} from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import { isProduction } from '../environment';

import { MultichainState } from '../../../ui/selectors/multichain';

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
    selectedNetworkClientId: string;
    networkConfigurations?: {
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
 * Checks if the selected account has a non-zero balance.
 *
 * @param state - The state object containing account information.
 * @returns true if the selected account has a non-zero balance, otherwise false.
 */
const hasNonZeroBalance = (state: SmartTransactionsMetaMaskState) => {
  const selectedAccount = getSelectedAccount(
    state as unknown as MultichainState,
  );
  return BigInt(selectedAccount?.balance || '0x0') > 0n;
};

export const getIsSmartTransactionsOptInModalAvailable = (
  state: SmartTransactionsMetaMaskState,
) => {
  return (
    getCurrentChainSupportsSmartTransactions(state) &&
    getIsAllowedRpcUrlForSmartTransactions(state) &&
    getSmartTransactionsOptInStatus(state) === null &&
    hasNonZeroBalance(state)
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
