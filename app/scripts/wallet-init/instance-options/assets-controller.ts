import {
  AssetsController,
  type AssetsControllerMessenger,
} from '@metamask/assets-controller';
import { createApiPlatformClient } from '@metamask/core-backend';
import type {
  TraceCallback as ControllerTraceCallback,
  TraceContext as ControllerTraceContext,
  TraceRequest as ControllerTraceRequest,
} from '@metamask/controller-utils';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { WalletOptions } from '@metamask/wallet';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import type { OnboardingControllerState } from '../../controllers/onboarding';
import type { PreferencesControllerState } from '../../controllers/preferences-controller';
import type { MessengerClientPersistedState } from '../../messenger-client-init/types';
import type { AssetsControllerInitMessenger } from '../messengers/assets-controller-messenger';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateTracesEnabled,
  type AssetsUnifyStateFeatureFlag,
} from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import {
  getBackendApiUrlsOption,
  isBackendAuthDisabled,
} from '../../../../shared/lib/core-backend-api-urls';
import { traceAsControllerCallback } from '../../../../shared/lib/trace';

type AssetsControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['assetsController']
>;

type GetAssetsControllerInstanceOptionsRequest = {
  getIsUiOpen: () => boolean;
  initMessenger: AssetsControllerInitMessenger;
  persistedState: MessengerClientPersistedState;
};

const ARC_CAIP_CHAIN_ID = toEvmCaipChainId(CHAIN_IDS.ARC);

/**
 * Cached API client instance.
 */
let apiClient: AssetsControllerInstanceOptions['queryApiClient'] | null = null;

/**
 * Safely retrieves the bearer token for API authentication.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The bearer token or undefined if retrieval fails.
 */
async function safeGetBearerToken(
  initMessenger: AssetsControllerInitMessenger,
): Promise<string | undefined> {
  // Same gate as the price and accounts API lanes. Fetching a token signs the
  // SRP in to the identity APIs, so skip it while basic functionality is off
  // or onboarding is incomplete. Requests still go out unauthenticated.
  if (isBackendAuthDisabled() || !getIsBasicFunctionality(initMessenger)()) {
    return undefined;
  }
  try {
    return await initMessenger.call('AuthenticationController:getBearerToken');
  } catch {
    return undefined;
  }
}

/**
 * Safely retrieves the token detection preference.
 *
 * @param initMessenger - The initialization messenger.
 * @returns Whether token detection is enabled (defaults to true on error).
 */
function safeGetTokenDetectionEnabled(
  initMessenger: AssetsControllerInitMessenger,
): boolean {
  try {
    const preferencesState = initMessenger.call(
      'PreferencesController:getState',
    );
    return preferencesState?.useTokenDetection ?? true;
  } catch {
    return true;
  }
}

/**
 * Returns a getter for basic functionality (use external services) from preferences.
 * When true, token/price APIs are used; when false, only RPC is used.
 * Also returns false during onboarding (before the user has completed setup),
 * matching the behavior of the UI polling hooks (useCurrencyRatePolling, useTokenRatesPolling).
 *
 * @param initMessenger - The initialization messenger.
 * @returns Getter that returns whether basic functionality is enabled (defaults to true on error).
 */
function getIsBasicFunctionality(
  initMessenger: AssetsControllerInitMessenger,
): () => boolean {
  return (): boolean => {
    try {
      const { completedOnboarding } = initMessenger.call(
        'OnboardingController:getState',
      );
      if (!completedOnboarding) {
        return false;
      }
      const preferencesState = initMessenger.call(
        'PreferencesController:getState',
      ) as { useExternalServices?: boolean } | undefined;
      return preferencesState?.useExternalServices ?? true;
    } catch {
      return true;
    }
  };
}

/**
 * Whether AssetsController Sentry tracing is enabled via
 * `assetsUnifyState.tracesEnabled`.
 *
 * @param initMessenger - The initialization messenger.
 * @returns True when tracing should run, false otherwise.
 */
function isAssetsControllerTracesEnabled(
  initMessenger: AssetsControllerInitMessenger,
): boolean {
  try {
    const { remoteFeatureFlags } = initMessenger.call(
      'RemoteFeatureFlagController:getState',
    );
    return isAssetsUnifyStateTracesEnabled(
      remoteFeatureFlags?.[ASSETS_UNIFY_STATE_FLAG] as
        | AssetsUnifyStateFeatureFlag
        | undefined,
      ASSETS_UNIFY_STATE_VERSION_1,
    );
  } catch {
    return false;
  }
}

/**
 * Trace callback gated by `assetsUnifyState.tracesEnabled`.
 * When the flag is off, runs `fn` (if provided) without creating a Sentry span.
 *
 * @param initMessenger - The initialization messenger used to read the flag.
 * @returns A {@link ControllerTraceCallback} suitable for AssetsController.
 */
function createAssetsControllerTrace(
  initMessenger: AssetsControllerInitMessenger,
): ControllerTraceCallback {
  return <Result>(
    req: ControllerTraceRequest,
    fn?: (ctx?: ControllerTraceContext) => Result,
  ): Promise<Result> => {
    if (!isAssetsControllerTracesEnabled(initMessenger)) {
      return Promise.resolve(fn?.() as Result);
    }
    return traceAsControllerCallback(req, fn);
  };
}

/**
 * Gets or creates the API platform client.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The API platform client.
 */
function getApiClient(
  initMessenger: AssetsControllerInitMessenger,
): AssetsControllerInstanceOptions['queryApiClient'] {
  if (!apiClient) {
    apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      clientVersion: process.env.METAMASK_VERSION,
      getBearerToken: () => safeGetBearerToken(initMessenger),
      ...getBackendApiUrlsOption(),
    }) as unknown as AssetsControllerInstanceOptions['queryApiClient'];
  }
  return apiClient;
}

/**
 * Build the extension's client-specific options for `AssetsController`.
 *
 * `@metamask/wallet` constructs the controller from these options and supplies
 * `messenger` and `state`. Options are built inside `initializeWallet`, before
 * `PreferencesController` exists, so preference reads stay lazy.
 *
 * @param request - The request object.
 * @param request.getIsUiOpen - Whether the extension UI is currently open.
 * @param request.initMessenger - Messenger used for onboarding, auth, preferences, and feature flags.
 * @param request.persistedState - Persisted controller state used by the assets metadata migration.
 * @returns The extension `AssetsController` instance options.
 */
export function getAssetsControllerInstanceOptions({
  getIsUiOpen,
  initMessenger,
  persistedState,
}: GetAssetsControllerInstanceOptionsRequest): AssetsControllerInstanceOptions {
  const isBasicFunctionality = getIsBasicFunctionality(initMessenger);

  // Extension: subscribe to PreferencesController:stateChange and notify the controller only when useExternalServices changes.
  // Also subscribe to OnboardingController:stateChange so that when onboarding completes, subscriptions are re-evaluated.
  const subscribeToBasicFunctionalityChange = (
    onChange: (isBasic: boolean) => void,
  ): void => {
    initMessenger.subscribe(
      'PreferencesController:stateChange',
      () => {
        onChange(isBasicFunctionality());
      },
      (state: PreferencesControllerState) => state.useExternalServices ?? true,
    );
    // When onboarding completes, re-evaluate basic functionality so price
    // subscriptions start (or stay stopped) based on the current preference.
    // This mirrors how useCurrencyRatePolling and useTokenRatesPolling gate on completedOnboarding.
    initMessenger.subscribe(
      'OnboardingController:stateChange',
      (completedOnboarding: boolean) => {
        if (completedOnboarding) {
          onChange(isBasicFunctionality());
        }
      },
      (state: OnboardingControllerState) => state.completedOnboarding,
    );
  };

  return {
    isEnabled: () => getIsUiOpen(),
    isBasicFunctionality,
    subscribeToBasicFunctionalityChange,
    queryApiClient: getApiClient(initMessenger),
    rpcDataSourceConfig: {
      tokenDetectionEnabled: () => safeGetTokenDetectionEnabled(initMessenger),
      balanceInterval: 30_000,
      detectionInterval: 180_000,
    },
    priceDataSourceConfig: {
      pollInterval: 180_000,
    },
    stakedBalanceDataSourceConfig: {
      pollInterval: 30_000,
      enabled: false,
    },
    isOnboarded: () => {
      try {
        const { completedOnboarding } = initMessenger.call(
          'OnboardingController:getState',
        );
        return completedOnboarding;
      } catch {
        return false;
      }
    },
    // TEMPORARY (ASSETS-3346): legacy state slices used to heal wiped `assetsInfo` metadata.
    tempMigrateAssetsInfoMetadataAssets3346: () => ({
      TokensController: persistedState.TokensController,
      AccountsController: persistedState.AccountsController,
    }),
    trace: createAssetsControllerTrace(initMessenger),
  };
}

/**
 * Forces a full Arc assets refresh after a confirmed transaction.
 *
 * Arc USDC is represented as a native asset in the wallet, but the
 * AccountActivity incremental balance update can miss that native USDC balance
 * after swaps while updating ERC-20 balances such as EURC correctly. A full
 * account asset scan resolves the native USDC balance, matching the manual
 * recovery path of reloading the extension or switching accounts.
 *
 * Subscribing is safe as soon as the wallet instance exists. The callback runs
 * later, on `transactionConfirmed`, when AccountTreeController is available.
 *
 * The controller messenger is protected, but it is the wallet-owned messenger
 * that already delegates `transactionConfirmed` and AccountTree reads.
 *
 * @param assetsControllerInstance - The initialized AssetsController instance.
 */
export function subscribeToArcTransactionConfirmedRefresh(
  assetsControllerInstance: AssetsController,
): void {
  const controllerMessenger = (
    assetsControllerInstance as AssetsController & {
      messenger: AssetsControllerMessenger;
    }
  ).messenger;

  controllerMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    (transactionMeta: TransactionMeta) => {
      if (transactionMeta.chainId?.toLowerCase() !== CHAIN_IDS.ARC) {
        return;
      }

      const fromAddress = transactionMeta.txParams.from?.toLowerCase();
      if (!fromAddress) {
        return;
      }

      // TODO: should be moved to the controller (comment on PR#46259)
      const matchedAccount = controllerMessenger
        .call('AccountTreeController:getAccountsFromSelectedAccountGroup')
        .find(
          (account: InternalAccount) =>
            account.address.toLowerCase() === fromAddress,
        );

      if (!matchedAccount) {
        return;
      }

      assetsControllerInstance
        .getAssets([matchedAccount], {
          chainIds: [ARC_CAIP_CHAIN_ID],
          forceUpdate: true,
          bypassServerCache: true,
        })
        .catch(() => undefined);
    },
  );
}
