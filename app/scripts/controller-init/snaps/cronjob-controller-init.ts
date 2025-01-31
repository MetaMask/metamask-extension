import { CronjobController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { CronjobControllerMessenger } from './cronjob-controller-messenger';

export const CronjobControllerInit: ControllerInitFunction<
  CronjobController,
  CronjobControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new CronjobController({
    // @ts-expect-error: `persistedState.CronjobController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.CronjobController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
