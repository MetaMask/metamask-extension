import { DeFiPositionsController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger,
} from '../messengers/defi-positions';

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

      const state = initMessenger.call('RemoteFeatureFlagController:getState');

      const featureFlagForDeFi = Boolean(
        state?.remoteFeatureFlags?.assetsDefiPositionsEnabled,
      );

      return completedOnboarding && useExternalServices && featureFlagForDeFi;
    },
    trackEvent: initMessenger.call.bind(
      initMessenger,
      'MetaMetricsController:trackEvent',
    ),
  });

  return {
    controller,
  };
};
