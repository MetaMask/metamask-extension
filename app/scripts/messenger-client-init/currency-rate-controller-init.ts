import {
  CodefiTokenPricesServiceV2,
  CurrencyRateController,
  CurrencyRateMessenger,
} from '@metamask/assets-controllers';
import { getIsDeprecatedController } from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import { CurrencyRateControllerInitMessenger } from './messengers';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the currency rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const CurrencyRateControllerInit: MessengerClientInitFunction<
  CurrencyRateController,
  CurrencyRateMessenger,
  CurrencyRateControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const messengerClient = new CurrencyRateController({
    // @ts-expect-error - CurrencyRateController is persisted as 'CurrencyController' but init pattern expects 'CurrencyRateController'
    state: persistedState.CurrencyController,
    messenger: controllerMessenger,
    includeUsdRate: true,
    useExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    isDeprecated: () => {
      // Only deprecate when AssetsController is actually included in this build
      // and can act as the replacement. When the build flag is off, AssetsController
      // is never initialized, so CurrencyRateController must remain active.
      if (!getIsAssetsUnifiedStateIncludedInBuild()) {
        return false;
      }
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      return getIsDeprecatedController(
        remoteFeatureFlags,
        'CurrencyRateController',
      );
    },
  });

  return {
    memStateKey: 'CurrencyController',
    persistedStateKey: 'CurrencyController',
    messengerClient,
  };
};
