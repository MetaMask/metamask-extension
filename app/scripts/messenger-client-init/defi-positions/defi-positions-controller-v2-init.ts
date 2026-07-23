import {
  DeFiPositionsControllerV2,
  DeFiPositionsControllerV2Messenger,
} from '@metamask/assets-controllers';
import { createApiPlatformClient } from '@metamask/core-backend';
import type { ApiPlatformClient } from '@metamask/core-backend';
import { MessengerClientInitFunction } from '../types';
import { DeFiPositionsControllerV2InitMessenger } from '../messengers/defi-positions';
import {
  DEFI_CONTROLLER_V2_FLAG,
  isDefiControllerV2Enabled,
  type DefiControllerV2FeatureFlag,
} from '../../../../shared/lib/defi-controller-v2/remote-feature-flag';

/**
 * Cached API client instance shared across init calls (matches AssetsController).
 */
let apiClient: ApiPlatformClient | null = null;

/**
 * Safely retrieves the bearer token for API authentication.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The bearer token or undefined if retrieval fails.
 */
async function safeGetBearerToken(
  initMessenger: DeFiPositionsControllerV2InitMessenger,
): Promise<string | undefined> {
  try {
    return await initMessenger.call('AuthenticationController:getBearerToken');
  } catch {
    return undefined;
  }
}

/**
 * Gets or creates the API platform client used to fetch DeFi positions.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The API platform client.
 */
function getApiClient(
  initMessenger: DeFiPositionsControllerV2InitMessenger,
): ApiPlatformClient {
  if (!apiClient) {
    apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      clientVersion: process.env.METAMASK_VERSION,
      getBearerToken: () => safeGetBearerToken(initMessenger),
    });
  }
  return apiClient;
}

export const DeFiPositionsControllerV2Init: MessengerClientInitFunction<
  DeFiPositionsControllerV2,
  DeFiPositionsControllerV2Messenger,
  DeFiPositionsControllerV2InitMessenger
> = ({ initMessenger, controllerMessenger, getMessengerClient }) => {
  const getPreferencesController = () =>
    getMessengerClient('PreferencesController');
  const getOnboardingController = () =>
    getMessengerClient('OnboardingController');

  const messengerClient = new DeFiPositionsControllerV2({
    messenger: controllerMessenger,
    apiClient: getApiClient(initMessenger),
    isEnabled: () => {
      const {
        state: { useExternalServices },
      } = getPreferencesController();
      const {
        state: { completedOnboarding },
      } = getOnboardingController();

      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const defiControllerV2Enabled = isDefiControllerV2Enabled(
        remoteFeatureFlags?.[DEFI_CONTROLLER_V2_FLAG] as
          | DefiControllerV2FeatureFlag
          | undefined,
      );

      return (
        completedOnboarding && useExternalServices && defiControllerV2Enabled
      );
    },
    getVsCurrency: () =>
      initMessenger.call('CurrencyRateController:getState').currentCurrency,
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
