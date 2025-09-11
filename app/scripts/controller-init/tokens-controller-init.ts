import { TokensController } from '@metamask/assets-controllers';
import { assert } from '@metamask/utils';
import { ControllerInitFunction } from './types';
import {
  TokensControllerMessenger,
  TokensControllerInitMessenger,
} from './messengers';

export const TokensControllerInit: ControllerInitFunction<
  TokensController,
  TokensControllerMessenger,
  TokensControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // This replicates `#getGlobalChainId` in the `MetaMaskController`.
  const networkState = initMessenger.call('NetworkController:getState');
  const networkClientId = networkState.selectedNetworkClientId;

  const { chainId } = initMessenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration;

  const { provider } =
    initMessenger.call('NetworkController:getSelectedNetworkClient') ?? {};
  assert(provider, 'Provider is required to initialize TokensController.');

  const controller = new TokensController({
    messenger: controllerMessenger,
    state: persistedState.TokensController,
    provider,
    chainId,
  });

  return {
    controller,
  };
};
