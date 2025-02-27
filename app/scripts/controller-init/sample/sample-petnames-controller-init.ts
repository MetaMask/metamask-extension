import { Hex } from '@metamask/utils';
import {
  SamplePetnamesController,
  SamplePetnamesControllerMessenger,
} from '../../controllers/sample';
import { ControllerInitFunction } from '../types';

export const SamplePetnamesControllerInit: ControllerInitFunction<
  SamplePetnamesController,
  SamplePetnamesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SamplePetnamesController({
    messenger: controllerMessenger,
    state: persistedState.SamplePetnamesController,
  });
  return {
    controller,
    api: {
      assignPetname: (chainId: Hex, address: Hex, name: string) => {
        controller.assignPetname(chainId, address, name);
      },
    },
  };
};
