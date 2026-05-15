import {
  Messenger,
  type MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import { RootMessenger } from '../../lib/messenger';
import { type StaticAssetsControllerMessenger } from '../../controllers/static-assets-controller';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * static assets controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getStaticAssetsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<StaticAssetsControllerMessenger>,
    MessengerEvents<StaticAssetsControllerMessenger>
  >,
) {
  const controllerMessenger: StaticAssetsControllerMessenger = new Messenger({
    namespace: 'StaticAssetsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:findNetworkClientIdByChainId',
      'TokensController:getState',
      'TokensController:addTokens',
    ],
    events: [],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type StaticAssetsControllerInitMessenger = ReturnType<
  typeof getStaticAssetsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the static assets controller.
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
    actions: ['RemoteFeatureFlagController:getState'],
  });
  return controllerInitMessenger;
}
