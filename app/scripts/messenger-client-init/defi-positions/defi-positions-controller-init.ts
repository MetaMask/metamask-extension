import { DeFiPositionsController } from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger,
} from '../messengers/defi-positions';
import {
  DEFAULT_FEATURE_FLAG_VALUES,
  FeatureFlagNames,
} from '../../../../shared/lib/feature-flags';

export const DeFiPositionsControllerInit: MessengerClientInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger
> = ({ initMessenger, controllerMessenger, getMessengerClient }) => {
  const getPreferencesController = () =>
    getMessengerClient('PreferencesController');
  const getOnboardingController = () =>
    getMessengerClient('OnboardingController');

  const messengerClient = new DeFiPositionsController({
    messenger: controllerMessenger,
    isEnabled: () => {
      const {
        state: { useExternalServices },
      } = getPreferencesController();
      const {
        state: { completedOnboarding },
      } = getOnboardingController();

      const assetsDefiPositionsEnabled = Boolean(
        initMessenger.call('RemoteFeatureFlagController:getState')
          ?.remoteFeatureFlags?.[FeatureFlagNames.AssetsDefiPositionsEnabled] ??
        DEFAULT_FEATURE_FLAG_VALUES[
          FeatureFlagNames.AssetsDefiPositionsEnabled
        ],
      );

      return (
        completedOnboarding && useExternalServices && assetsDefiPositionsEnabled
      );
    },
    trackEvent: initMessenger.call.bind(
      initMessenger,
      'MetaMetricsController:trackEvent',
    ),
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
