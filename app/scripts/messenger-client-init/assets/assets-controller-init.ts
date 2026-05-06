import {
  AssetsController,
  type AssetsControllerOptions,
} from '@metamask/assets-controller';
import type { PreferencesState } from '@metamask/preferences-controller';
import { createApiPlatformClient } from '@metamask/core-backend';
import { type MessengerClientInitFunction } from '../types';
import {
  type AssetsControllerMessenger,
  type AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';
import { traceAsControllerCallback } from '../../../../shared/lib/trace';
import type { OnboardingControllerState } from '../../controllers/onboarding';

/**
 * Cached API client instance.
 */
let apiClient: AssetsControllerOptions['queryApiClient'] | null = null;

/**
 * Safely retrieves the bearer token for API authentication.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The bearer token or undefined if retrieval fails.
 */
async function safeGetBearerToken(
  initMessenger: AssetsControllerInitMessenger,
): Promise<string | undefined> {
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
 * Gets or creates the API platform client.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The API platform client.
 */
function getApiClient(
  initMessenger: AssetsControllerInitMessenger,
): AssetsControllerOptions['queryApiClient'] {
  if (!apiClient) {
    apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      getBearerToken: () => safeGetBearerToken(initMessenger),
    }) as unknown as AssetsControllerOptions['queryApiClient'];
  }
  return apiClient;
}

/**
 * Init function for the AssetsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger to use for the controller.
 * @returns The initialized controller.
 */
export const AssetsControllerInit: MessengerClientInitFunction<
  AssetsController,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  // Get token detection preference
  const tokenDetectionEnabled = safeGetTokenDetectionEnabled(initMessenger);

  // Basic functionality: when true (useExternalServices), token/price APIs are used; when false, RPC only.
  const isBasicFunctionality = getIsBasicFunctionality(initMessenger);

  // Extension: subscribe to PreferencesController:stateChange and notify the controller only when useExternalServices changes.
  // Also subscribe to OnboardingController:stateChange so that when onboarding completes, subscriptions are re-evaluated.
  // Mobile can pass a different implementation (e.g. Redux or app-specific listener).
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

  // Create the controller - it now creates all data sources internally.
  // queryApiClient is cast to the package's type to avoid duplicate @metamask/core-backend type conflicts.
  const messengerClient = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
    isEnabled: () => true,
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
    trace: traceAsControllerCallback,
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
  });

  return { messengerClient };
};
