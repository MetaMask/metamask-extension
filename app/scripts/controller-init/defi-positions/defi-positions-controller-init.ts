import {
  DeFiPositionsController,
  DeFiPositionsControllerMessenger,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';

export const DeFiPositionsControllerInit: ControllerInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger
> = ({ controllerMessenger, getController }) => {
  const getPreferencesController = () => getController('PreferencesController');

  const controller = new DeFiPositionsController({
    messenger: controllerMessenger,
    isEnabled: () => {
      // TODO: Use feature flag as part of the condition here
      const preferencesController = getPreferencesController();
      return preferencesController.state.useExternalServices;
    },
  });

  return {
    controller,
  };
};
