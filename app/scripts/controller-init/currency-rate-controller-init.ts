import {
  CodefiTokenPricesServiceV2,
  CurrencyRateController,
} from '@metamask/assets-controllers';
import {
  CurrencyRateControllerInitMessenger,
  CurrencyRateControllerMessenger,
} from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the currency rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const CurrencyRateControllerInit: ControllerInitFunction<
  CurrencyRateController,
  CurrencyRateControllerMessenger,
  CurrencyRateControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  // TODO: Fix CurrencyRateControllerMessenger type - add CurrencyRateControllerActions & CurrencyRateControllerEvents
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const controller = new CurrencyRateController({
    // @ts-expect-error - CurrencyRateController is persisted as 'CurrencyController' but init pattern expects 'CurrencyRateController'
    state: persistedState.CurrencyController,
    // @ts-expect-error - Messenger type mismatch due to missing controller actions/events and dependency version mismatch
    messenger: controllerMessenger,
    includeUsdRate: true,
    useExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
  });

  return {
    memStateKey: 'CurrencyController',
    persistedStateKey: 'CurrencyController',
    controller,
  };
};
