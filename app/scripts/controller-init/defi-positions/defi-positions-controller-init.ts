import { DeFiPositionsControllerMessenger } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { DeFiPositionsController } from '@metamask/assets-controllers';

export const DeFiPositionsControllerInit: ControllerInitFunction<
  DeFiPositionsController,
  DeFiPositionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new DeFiPositionsController({
    state: persistedState.DeFiPositionsController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
