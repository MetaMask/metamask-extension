import {
  PetNamesController as SamplePetnamesController,
  PetNamesControllerMessenger as SamplePetnamesControllerMessenger,
  PetNamesControllerState as SamplePetnamesControllerState,
} from '@metamask/sample-controllers';
import { ControllerInitFunction } from '../types';

export const SamplePetnamesControllerInit: ControllerInitFunction<
  SamplePetnamesController,
  SamplePetnamesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SamplePetnamesController({
    messenger: controllerMessenger,
    state: persistedState as unknown as Partial<SamplePetnamesControllerState>,
  });

  return {
    controller,
  };
};
