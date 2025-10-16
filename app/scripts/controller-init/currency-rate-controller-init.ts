import { CurrencyRateController } from '@metamask/assets-controllers';
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
  const controller = new CurrencyRateController({
    // @ts-expect-error: `CurrencyRateController` is persisted as
    // `CurrencyController`, but the controller init pattern doesn't
    // allow this in the type of `persistedState`.
    state: persistedState.CurrencyController,
    messenger: controllerMessenger,
    includeUsdRate: true,
    useExternalServices: () =>
      initMessenger.call('PreferencesController:getState').useExternalServices,
  });

  // TODO: This logic should be ported to `CurrencyRateController` directly.
  const originalFetchMultiExchangeRate =
    // @ts-expect-error: Accessing private method.
    controller.fetchMultiExchangeRate.bind(controller);

  // @ts-expect-error: Accessing private method.
  controller.fetchMultiExchangeRate = (...args) => {
    const { useCurrencyRateCheck } = initMessenger.call(
      'PreferencesController:getState',
    );

    if (useCurrencyRateCheck) {
      return originalFetchMultiExchangeRate(...args);
    }

    return {
      conversionRate: null,
      usdConversionRate: null,
    };
  };

  return {
    memStateKey: 'CurrencyController',
    persistedStateKey: 'CurrencyController',
    controller,
  };
};
