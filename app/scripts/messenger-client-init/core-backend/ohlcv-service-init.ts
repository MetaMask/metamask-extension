import { OHLCVService, OHLCVServiceMessenger } from '@metamask/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the OHLCV service for real-time candlestick streaming.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const OHLCVServiceInit: MessengerClientInitFunction<
  OHLCVService,
  OHLCVServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new OHLCVService({
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
