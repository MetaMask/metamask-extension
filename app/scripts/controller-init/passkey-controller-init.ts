import { PasskeyController } from '@metamask/passkey-controller';
import type { PasskeyControllerMessenger } from './messengers';
import type { ControllerInitFunction } from './types';

export const PasskeyControllerInit: ControllerInitFunction<
  PasskeyController,
  PasskeyControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new PasskeyController({
    state: persistedState.PasskeyController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
