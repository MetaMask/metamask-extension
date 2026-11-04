import {
  MarketStatsService,
  type MarketStatsServiceMessenger,
} from '@metamask/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize real-time spot prices over the shared backend WebSocket.
 *
 * Constructed before `AssetsController`. That controller calls
 * `MarketStatsService:subscribe` for tracked assets the Price API marks
 * as streamable. Screens that need a price for an asset the controller
 * does not track call `subscribe` on this service directly.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MarketStatsServiceInit: MessengerClientInitFunction<
  MarketStatsService,
  MarketStatsServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MarketStatsService({
    messenger: controllerMessenger,
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    traceFn: trace,
  });

  messengerClient.init();

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
