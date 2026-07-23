import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { ConfigRegistryApiServiceMessenger } from '@metamask/config-registry-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<ConfigRegistryApiServiceMessenger>;

type AllowedEvents = MessengerEvents<ConfigRegistryApiServiceMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events for
 * ConfigRegistryApiService.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getConfigRegistryApiServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): ConfigRegistryApiServiceMessenger {
  return new Messenger<
    'ConfigRegistryApiService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'ConfigRegistryApiService',
    parent: messenger,
  });
}
