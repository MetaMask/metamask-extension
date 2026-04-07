import type { ControllerInitFunction } from './types';
import type { PriceApiServiceMessenger } from '@metamask-previews/price-api';
import { PriceApiService } from '@metamask-previews/price-api';

/**
 * Initialize the price API service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const PriceApiServiceInit: ControllerInitFunction<
  PriceApiService,
  PriceApiServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new PriceApiService({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller: service,
  };
};
