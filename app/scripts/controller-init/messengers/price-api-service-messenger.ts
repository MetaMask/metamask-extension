import type { PriceApiServiceMessenger } from '@metamask-previews/price-api';
import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = MessengerActions<PriceApiServiceMessenger>;

type AllowedEvents = MessengerEvents<PriceApiServiceMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPriceApiServiceMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): PriceApiServiceMessenger {
  const serviceMessenger = new Messenger<
    'PriceApiService',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PriceApiService',
    parent: messenger,
  });
  return serviceMessenger;
}
