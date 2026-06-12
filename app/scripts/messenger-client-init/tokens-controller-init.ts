import {
  TokensController,
  TokensControllerMessenger,
} from '@metamask/assets-controllers';
import { assert } from '@metamask/utils';
import { MessengerClientInitFunction } from './types';
import { TokensControllerInitMessenger } from './messengers';
import { getGlobalChainId } from './init-utils';
import { tokenListService } from './token-list-service';

export const TokensControllerInit: MessengerClientInitFunction<
  TokensController,
  TokensControllerMessenger,
  TokensControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const { provider } =
    initMessenger.call('NetworkController:getSelectedNetworkClient') ?? {};
  assert(provider, 'Provider is required to initialize TokensController.');

  // TODO: Fix TokensControllerMessenger type - add TokensControllerActions & TokensControllerEvents
  // TODO: Bump @metamask/network-controller, @metamask/accounts-controller, @metamask/keyring-controller to match assets-controllers
  const messengerClient = new TokensController({
    messenger: controllerMessenger,
    state: persistedState.TokensController,
    provider,
    chainId: getGlobalChainId(initMessenger),
    tokenListService,
  });

  return {
    messengerClient,
  };
};
