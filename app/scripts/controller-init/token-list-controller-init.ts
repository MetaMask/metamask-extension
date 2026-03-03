import { TokenListController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from './types';
import {
  TokenListControllerMessenger,
  TokenListControllerInitMessenger,
} from './messengers';
import { getGlobalChainId } from './init-utils';

export const TokenListControllerInit: ControllerInitFunction<
  TokenListController,
  TokenListControllerMessenger,
  TokenListControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // TODO: Fix TokenListControllerMessenger type - add TokenListControllerActions & TokenListControllerEvents
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const controller = new TokenListController({
    messenger: controllerMessenger,
    state: persistedState.TokenListController,
    chainId: getGlobalChainId(initMessenger),
  });

  // Load cached token lists from storage before the first poll executes.
  // Polling can begin before `initialize` resolves during app bootstrap, so
  // we gate `_executePoll` to avoid redundant token API requests.
  const initializePromise = controller.initialize().catch((error: Error) => {
    console.error(
      'TokenListController: Failed to initialize from storage:',
      error,
    );
  });

  const executePoll = controller._executePoll.bind(controller);
  controller._executePoll = async (input) => {
    await initializePromise;
    return executePoll(input);
  };

  return {
    controller,
  };
};
