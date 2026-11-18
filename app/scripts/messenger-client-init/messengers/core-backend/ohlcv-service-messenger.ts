import {
  OHLCVServiceMessenger,
  OHLCV_SERVICE_ALLOWED_ACTIONS,
  OHLCV_SERVICE_ALLOWED_EVENTS,
} from '@metamask/core-backend';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the OHLCV service. This is scoped to the
 * actions and events that the OHLCV service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getOHLCVServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<OHLCVServiceMessenger>,
    MessengerEvents<OHLCVServiceMessenger>
  >,
): OHLCVServiceMessenger {
  const serviceMessenger: OHLCVServiceMessenger = new Messenger({
    namespace: 'OHLCVService',
    parent: messenger,
  });
  // Delegate exactly the actions/events the OHLCV service needs, sourced from
  // the allow-lists `@metamask/core-backend` exports. This grants minimal
  // permissions and stays in sync with core instead of a hand-maintained list.
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [...OHLCV_SERVICE_ALLOWED_ACTIONS],
    events: [...OHLCV_SERVICE_ALLOWED_EVENTS],
  });
  return serviceMessenger;
}
