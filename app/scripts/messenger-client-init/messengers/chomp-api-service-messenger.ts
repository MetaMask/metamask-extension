import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { ChompApiServiceMessenger } from '@metamask/chomp-api-service';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the ChompApiService, scoped to the actions and events
 * it is allowed to use.
 *
 * @param messenger - The root messenger.
 * @returns The ChompApiService messenger.
 */
export function getChompApiServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<ChompApiServiceMessenger>,
    MessengerEvents<ChompApiServiceMessenger>
  >,
): ChompApiServiceMessenger {
  const serviceMessenger: ChompApiServiceMessenger = new Messenger({
    namespace: 'ChompApiService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
    events: [],
  });

  return serviceMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type ChompApiServiceInitMessenger = ReturnType<
  typeof getChompApiServiceInitMessenger
>;

/**
 * Create a messenger for the actions needed while initializing the
 * ChompApiService.
 *
 * The service's base URL comes from the `moneyAccountChompConfig` remote
 * feature flag, read once at construction.
 *
 * @param messenger - The root messenger.
 * @returns The ChompApiService init messenger.
 */
export function getChompApiServiceInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const initMessenger = new Messenger<
    'ChompApiServiceInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'ChompApiServiceInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
    events: [],
  });

  return initMessenger;
}
