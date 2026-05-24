import { TokenListController } from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from './types';
import {
  TokenListControllerMessenger,
  TokenListControllerInitMessenger,
} from './messengers';
import { getGlobalChainId } from './init-utils';

export const TokenListControllerInit: MessengerClientInitFunction<
  TokenListController,
  TokenListControllerMessenger,
  TokenListControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // TODO: Fix TokenListControllerMessenger type - add TokenListControllerActions & TokenListControllerEvents
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const messengerClient = new TokenListController({
    messenger: controllerMessenger,
    state: persistedState.TokenListController,
    chainId: getGlobalChainId(initMessenger),
  });

  // Initialize the controller to load cached token lists from storage.
  // This is a fire-and-forget operation - if it fails, the controller will
  // self-heal by fetching token lists on demand when needed.
  messengerClient.initialize().catch((error: Error) => {
    console.error(
      'TokenListController: Failed to initialize from storage:',
      error,
    );
  });

  return {
    messengerClient,
  };
};
