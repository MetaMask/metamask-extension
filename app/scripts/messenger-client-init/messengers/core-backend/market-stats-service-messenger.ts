import {
  MARKET_STATS_SERVICE_ALLOWED_ACTIONS,
  MARKET_STATS_SERVICE_ALLOWED_EVENTS,
  type MarketStatsServiceMessenger,
} from '@metamask/core-backend';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the market-stats service.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getMarketStatsServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MarketStatsServiceMessenger>,
    MessengerEvents<MarketStatsServiceMessenger>
  >,
): MarketStatsServiceMessenger {
  const serviceMessenger: MarketStatsServiceMessenger = new Messenger({
    namespace: 'MarketStatsService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [...MARKET_STATS_SERVICE_ALLOWED_ACTIONS],
    events: [...MARKET_STATS_SERVICE_ALLOWED_EVENTS],
  });
  return serviceMessenger;
}
