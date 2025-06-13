import { createSelector } from 'reselect';
import {
  getAllowedSmartTransactionsChainIds,
  SKIP_STX_RPC_URL_CHECK_CHAIN_IDS,
} from '../../constants/smartTransactions';
import {
  accountSupportsSmartTx,
  getPreferences,
  selectDefaultRpcEndpointByChainId,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import { isProduction } from '../environment';
import { getFeatureFlagsByChainId } from './feature-flags';
import { getCurrentChainId, NetworkState } from './networks';

export type SmartTransactionsMetaMaskState = {
  metamask: {
    preferences: {
      smartTransactionsOptInStatus?: boolean;
      smartTransactionsMigrationApplied?: boolean;
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
            extensionReturnTxHashAsap?: boolean;
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
  };
};

export type SmartTransactionsState = SmartTransactionsMetaMaskState &
  NetworkState;

/**
 * Returns the user's explicit opt-in status for the smart transactions feature.
 * This should only be used for reading the user's internal opt-in status, and
 * not for determining if the smart transactions user preference is enabled.
 *
 * To determine if the smart transactions user preference is enabled, use
 * getSmartTransactionsPreferenceEnabled instead.
 *
 * @param state - The state object.
 * @returns true if the user has explicitly opted in, false if they have opted out,
 * or null if they have not explicitly opted in or out.
 */
export const getSmartTransactionsOptInStatusInternal = createSelector(
  getPreferences,
  (preferences: { smartTransactionsOptInStatus?: boolean }): boolean => {
    return preferences?.smartTransactionsOptInStatus ?? true;
  },
);

/**
 * Returns whether the smart transactions migration has been applied to the user's settings.
 * This specifically tracks if Migration 135 has been run, which enables Smart Transactions
 * by default for users who have never interacted with the feature or who previously opted out
 * with no STX activity.
 *
 * This should only be used for internal checks of the migration status, and not
 * for determining overall Smart Transactions availability.
 *
 * @param state - The state object.
 * @returns true if the migration has been applied to the user's settings, false if not or if unset.
 */
export const getSmartTransactionsMigrationAppliedInternal = createSelector(
  getPreferences,
  (preferences: { smartTransactionsMigrationApplied?: boolean }): boolean => {
    return preferences?.smartTransactionsMigrationApplied ?? false;
  },
);

/**
 * Returns the user's explicit opt-in status for the smart transactions feature.
 * This should only be used for metrics collection, and not for determining if the
 * smart transactions user preference is enabled.
 *
 * To determine if the smart transactions user preference is enabled, use
 * getSmartTransactionsPreferenceEnabled instead.
 *
 * @param state - The state object.
 * @returns true if the user has explicitly opted in, false if they have opted out,
 * or null if they have not explicitly opted in or out.
 */
// @ts-expect-error TODO: Fix types for `getSmartTransactionsOptInStatusInternal` once `getPreferences is converted to TypeScript
export const getSmartTransactionsOptInStatusForMetrics = createSelector(
  getSmartTransactionsOptInStatusInternal,
  (optInStatus: boolean): boolean => optInStatus,
);

/**
 * Returns the user's preference for the smart transactions feature.
 * Defaults to `true` if the user has not set a preference.
 *
 * @param state
 * @returns
 */
// @ts-expect-error TODO: Fix types for `getSmartTransactionsOptInStatusInternal` once `getPreferences is converted to TypeScript
export const getSmartTransactionsPreferenceEnabled = createSelector(
  getSmartTransactionsOptInStatusInternal,
  (optInStatus: boolean): boolean => {
    // In the absence of an explicit opt-in or opt-out,
    // the Smart Transactions toggle is enabled.
    const DEFAULT_SMART_TRANSACTIONS_ENABLED = true;
    return optInStatus ?? DEFAULT_SMART_TRANSACTIONS_ENABLED;
  },
);

export const getChainSupportsSmartTransactions = (
  state: NetworkState,
  chainId?: string,
): boolean => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveChainId = chainId || getCurrentChainId(state);
  return getAllowedSmartTransactionsChainIds().includes(effectiveChainId);
};

const getIsAllowedRpcUrlForSmartTransactions = (
  state: NetworkState,
  chainId?: string,
) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveChainId = chainId || getCurrentChainId(state);
  // Allow in non-production or if chain ID is on skip list.
  if (
    !isProduction() ||
    SKIP_STX_RPC_URL_CHECK_CHAIN_IDS.includes(effectiveChainId)
  ) {
    return true;
  }

  // Get the default RPC endpoint directly for this chain ID
  const defaultRpcEndpoint = selectDefaultRpcEndpointByChainId(
    state,
    effectiveChainId,
  );
  const rpcUrl = defaultRpcEndpoint?.url;
  const hostname = rpcUrl && new URL(rpcUrl).hostname;

  return (
    hostname?.endsWith('.infura.io') ||
    hostname?.endsWith('.binance.org') ||
    false
  );
};

export const getSmartTransactionsEnabled = (
  state: SmartTransactionsState,
  chainId?: string,
): boolean => {
  const supportedAccount = accountSupportsSmartTx(state);
  // @ts-expect-error Smart transaction selector types does not match controller state
  const featureFlagsByChainId = getFeatureFlagsByChainId(state, chainId);
  // TODO: Create a new proxy service only for MM feature flags.
  const smartTransactionsFeatureFlagEnabled =
    featureFlagsByChainId?.smartTransactions?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    getChainSupportsSmartTransactions(state, chainId) &&
      getIsAllowedRpcUrlForSmartTransactions(state, chainId) &&
      supportedAccount &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getIsSmartTransaction = (
  state: SmartTransactionsState,
  chainId?: string,
): boolean => {
  const smartTransactionsPreferenceEnabled =
    getSmartTransactionsPreferenceEnabled(state);
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state, chainId);
  return Boolean(
    smartTransactionsPreferenceEnabled && smartTransactionsEnabled,
  );
};
