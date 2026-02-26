import { DeFiPositionsController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger,
} from '../messengers/defi-positions';
import {
  DEFAULT_FEATURE_FLAG_VALUES,
  FeatureFlagNames,
} from '../../../../shared/modules/feature-flags';

export const DeFiPositionsControllerInit: ControllerInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger
> = ({ initMessenger, controllerMessenger, getController }) => {
  const getPreferencesController = () => getController('PreferencesController');
  const getOnboardingController = () => getController('OnboardingController');

  const controller = new DeFiPositionsController({
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
    controller,
    persistedStateKey: null,
  };
};
