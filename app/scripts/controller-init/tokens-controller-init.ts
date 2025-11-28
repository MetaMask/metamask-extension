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

  const controller = new TokensController({
    messenger: controllerMessenger,
    state: persistedState.TokensController,
    // TODO: Remove @ts-expect-error once @metamask/network-controller is bumped in
    // @metamask/assets-controllers. The provider from NetworkController:getSelectedNetworkClient
    // is a SwappableProxy that's runtime-compatible with Provider but TypeScript can't verify
    // the private field requirement due to version mismatch.
    // @ts-expect-error - Provider type mismatch between SwappableProxy and InternalProvider
    provider,
    chainId: getGlobalChainId(initMessenger),
  });

  return {
    controller,
  };
};
