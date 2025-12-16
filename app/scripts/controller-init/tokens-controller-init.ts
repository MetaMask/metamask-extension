import { TokensController } from '@metamask/assets-controllers';
import { assert } from '@metamask/utils';
import { ControllerInitFunction } from './types';
import {
  TokensControllerMessenger,
  TokensControllerInitMessenger,
} from './messengers';
import { getGlobalChainId } from './init-utils';

export const TokensControllerInit: ControllerInitFunction<
  TokensController,
  TokensControllerMessenger,
  TokensControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const { provider } =
    initMessenger.call('NetworkController:getSelectedNetworkClient') ?? {};
  assert(provider, 'Provider is required to initialize TokensController.');

  // TODO: Fix TokensControllerMessenger type - add TokensControllerActions & TokensControllerEvents
  // TODO: Bump @metamask/network-controller, @metamask/accounts-controller, @metamask/keyring-controller to match assets-controllers
  const controller = new TokensController({
    // @ts-expect-error - Messenger type mismatch due to missing controller actions/events and dependency version mismatch
    messenger: controllerMessenger,
    state: persistedState.TokensController,
    // @ts-expect-error - Provider type mismatch between SwappableProxy and InternalProvider due to network-controller version mismatch
    provider,
    chainId: getGlobalChainId(initMessenger),
  });

  return {
    controller,
  };
};
