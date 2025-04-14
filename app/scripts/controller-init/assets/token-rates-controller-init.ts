import {
  CodefiTokenPricesServiceV2,
  TokenRatesController,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { TokenRatesControllerMessenger } from '../messengers/assets';

/**
 * Initialize the Token Rates controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const TokenRatesControllerInit: ControllerInitFunction<
  TokenRatesController,
  TokenRatesControllerMessenger
> = (request) => {
  const { controllerMessenger, getController, persistedState } = request;
  const preferencesController = () => getController('PreferencesController');

  const controller = new TokenRatesController({
    messenger: controllerMessenger,
    state: persistedState.TokenRatesController,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    disabled: !preferencesController().state?.useCurrencyRateCheck,
  });

  return {
    controller,
  };
};
