import type { AssetsControllerMessenger } from '@metamask/assets-controller';
import { createApiPlatformClient } from '@metamask/core-backend';
import type {
  TraceCallback as ControllerTraceCallback,
  TraceContext as ControllerTraceContext,
  TraceRequest as ControllerTraceRequest,
} from '@metamask/controller-utils';
import type { PreferencesState } from '@metamask/preferences-controller';
import type { WalletOptions } from '@metamask/wallet';
import type { OnboardingControllerState } from '../../controllers/onboarding';
import type { AssetsControllerInitMessenger } from '../../messenger-client-init/messengers/assets/assets-controller-messenger';
import type { MessengerClientPersistedState } from '../../messenger-client-init/types';
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
  controllerMessenger: AssetsControllerMessenger;
  getIsUiOpen: () => boolean;
  initMessenger: AssetsControllerInitMessenger;
  persistedState: MessengerClientPersistedState;
};

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
 * Construction stays in messenger-client init so it runs after
 * `NetworkEnablementController`. These options are what `@metamask/wallet`'s
 * `assetsController.init` receives; the wallet supplies `messenger` and
 * `state`.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - Messenger used to subscribe to preference changes.
 * @param request.getIsUiOpen - Whether the extension UI is currently open.
 * @param request.initMessenger - Messenger used for onboarding, auth, and feature flags.
 * @param request.persistedState - Persisted controller state used by the assets metadata migration.
 * @returns The extension `AssetsController` instance options.
 */
export function getAssetsControllerInstanceOptions({
  controllerMessenger,
  getIsUiOpen,
  initMessenger,
  persistedState,
}: GetAssetsControllerInstanceOptionsRequest): AssetsControllerInstanceOptions {
  // Captured once at init. The getter closes over this snapshot.
  const tokenDetectionEnabled = safeGetTokenDetectionEnabled(initMessenger);
  const isBasicFunctionality = getIsBasicFunctionality(initMessenger);

  // Extension: subscribe to PreferencesController:stateChange and notify the controller only when useExternalServices changes.
  // Also subscribe to OnboardingController:stateChange so that when onboarding completes, subscriptions are re-evaluated.
  const subscribeToBasicFunctionalityChange = (
    onChange: (isBasic: boolean) => void,
  ): void => {
    controllerMessenger.subscribe(
      'PreferencesController:stateChange',
      (_useExternalServices: boolean) => {
        onChange(isBasicFunctionality());
      },
      (state: PreferencesState) =>
        (state as PreferencesState & { useExternalServices?: boolean })
          .useExternalServices ?? true,
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
      tokenDetectionEnabled: () => tokenDetectionEnabled,
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
