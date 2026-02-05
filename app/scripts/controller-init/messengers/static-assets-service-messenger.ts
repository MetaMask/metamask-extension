import { Messenger, MessengerActions } from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import { RootMessenger } from '../../lib/messenger';
import { type StaticAssetsServiceMessenger as StaticAssetsServiceMessengerType } from '../../controllers/static-assets-service';

type AllowedActions = MessengerActions<StaticAssetsServiceMessengerType>

export type StaticAssetsServiceMessenger = ReturnType<
  typeof getStaticAssetsServiceMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * static assets service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getStaticAssetsServiceMessenger(
  messenger: RootMessenger<AllowedActions>,
) {
  const serviceMessenger = new Messenger<
    'StaticAssetsService',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'StaticAssetsService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'NetworkController:findNetworkClientIdByChainId',
      'TokensController:getState',
      'TokensController:addTokens',
    ],
    events: [],
  });
  return serviceMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type StaticAssetsServiceInitMessenger = ReturnType<
  typeof getStaticAssetsServiceInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the static assets service.
 *
 * @param messenger
 */
export function getStaticAssetsServiceInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const serviceInitMessenger = new Messenger<
    'StaticAssetsServiceInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'StaticAssetsServiceInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });
  return serviceInitMessenger;
}
