import type {
  ControllerGetStateAction,
} from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerNetworkAddedEvent,
} from '@metamask/network-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  TokensControllerState,
  TokensControllerAddTokensAction,
} from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import { RootMessenger } from '../../lib/messenger';

// Not exported from `@metamask/assets-controllers`.
type TokensControllerGetStateAction = ControllerGetStateAction<
  'TokensController',
  TokensControllerState
>;

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | TokensControllerGetStateAction
  | TokensControllerAddTokensAction

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | NetworkControllerNetworkAddedEvent

export type StaticAssetsControllerMessenger = ReturnType<
  typeof getStaticAssetsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token balances controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getStaticAssetsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'StaticAssetsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'StaticAssetsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:findNetworkClientIdByChainId',
      'TokensController:getState',
      'AccountsController:getSelectedAccount',
      'TokensController:addTokens',
    ],
    events: [
      'NetworkController:networkAdded',
      'AccountsController:selectedEvmAccountChange',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type StaticAssetsControllerInitMessenger = ReturnType<
  typeof getStaticAssetsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token balances controller.
 *
 * @param messenger
 */
export function getStaticAssetsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'StaticAssetsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'StaticAssetsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
    ],
  });
  return controllerInitMessenger;
}
