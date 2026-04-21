import {
  CodefiTokenPricesServiceV2,
  CurrencyRateController,
} from '@metamask/assets-controllers';
import {
  CurrencyRateControllerInitMessenger,
  CurrencyRateControllerMessenger,
} from './messengers';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the currency rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const CurrencyRateControllerInit: MessengerClientInitFunction<
  CurrencyRateController,
  CurrencyRateControllerMessenger,
  CurrencyRateControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // TODO: Fix CurrencyRateControllerMessenger type - add CurrencyRateControllerActions & CurrencyRateControllerEvents
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const messengerClient = new CurrencyRateController({
    // @ts-expect-error - CurrencyRateController is persisted as 'CurrencyController' but init pattern expects 'CurrencyRateController'
    state: persistedState.CurrencyController,
    messenger: controllerMessenger,
    includeUsdRate: true,
    useExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
  });

  return {
    memStateKey: 'CurrencyController',
    persistedStateKey: 'CurrencyController',
    messengerClient,
  };
};
