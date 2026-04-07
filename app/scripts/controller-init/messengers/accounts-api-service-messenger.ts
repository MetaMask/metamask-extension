import type { AccountsApiServiceMessenger } from '@metamask-previews/accounts-api';
import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<AccountsApiServiceMessenger>;

type AllowedEvents = MessengerEvents<AccountsApiServiceMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * AccountsApiService.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountsApiServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): AccountsApiServiceMessenger {
  const serviceMessenger = new Messenger<
    'AccountsApiService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'AccountsApiService',
    parent: messenger,
  });
  return serviceMessenger;
}
