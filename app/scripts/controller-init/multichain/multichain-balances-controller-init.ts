import {
  MultichainBalancesController,
  MultichainBalancesControllerMessenger,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { MultichainBalancesControllerInitMessenger } from '../messengers/multichain-balances-controller-messenger';

export const MultichainBalancesControllerInit: ControllerInitFunction<
  MultichainBalancesController,
  // @ts-expect-error TODO: figure out why there's a mismatch
  MultichainBalancesControllerMessenger,
  MultichainBalancesControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new MultichainBalancesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainBalancesController,
  });

  return { controller };
};
