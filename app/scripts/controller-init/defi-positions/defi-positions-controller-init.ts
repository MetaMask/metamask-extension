import {
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { DeFiPositionsControllerInitMessenger } from '../messengers/defi-positions/defi-positions-controller-messenger';

export const DeFiPositionsControllerInit: ControllerInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
  DeFiPositionsControllerInitMessenger
> = ({ initMessenger, controllerMessenger, getController, trackEvent }) => {
  const getPreferencesController = () => getController('PreferencesController');

  const controller = new DeFiPositionsController({
    messenger: controllerMessenger,
    isEnabled: () => {
      const preferencesController = getPreferencesController();
      const { useExternalServices } = preferencesController.state;

      const state = initMessenger.call('RemoteFeatureFlagController:getState');

      const featureFlagForDeFi = Boolean(
        state?.remoteFeatureFlags?.assetsDefiPositionsEnabled,
      );

      return useExternalServices && featureFlagForDeFi;
    },
    trackEvent,
  });

  return {
    controller,
  };
};
