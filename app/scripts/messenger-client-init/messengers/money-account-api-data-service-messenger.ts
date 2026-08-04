import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountApiDataServiceMessenger } from '@metamask/money-account-api-data-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountApiDataService, scoped to the actions
 * and events the service is allowed to use.
 *
 * The bearer token is best-effort: the service swallows a rejection and issues
 * the request unauthenticated, falling back to IP-based rate limiting.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountApiDataService messenger.
 */
export function getMoneyAccountApiDataServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountApiDataServiceMessenger>,
    MessengerEvents<MoneyAccountApiDataServiceMessenger>
  >,
): MoneyAccountApiDataServiceMessenger {
  const serviceMessenger: MoneyAccountApiDataServiceMessenger = new Messenger({
    namespace: 'MoneyAccountApiDataService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });

  return serviceMessenger;
}
