import { NetworkEnablementController } from '@metamask/network-enablement-controller';
import { NetworkEnablementControllerMessenger } from '../messengers/assets';
import { ControllerInitFunction } from '../types';

export const NetworkEnablementControllerInit: ControllerInitFunction<
  NetworkEnablementController,
  NetworkEnablementControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new NetworkEnablementController({
    messenger: controllerMessenger,
    state: {
      ...persistedState.NetworkEnablementController,
    },
  });

  return {
    controller,
  };
};
