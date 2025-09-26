import {
  CodefiTokenPricesServiceV2,
  TokenRatesController,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import {
  TokenRatesControllerMessenger,
  TokenRatesControllerInitMessenger,
} from '../messengers/assets';
import { previousValueComparator } from '../../lib/util';

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
  TokenRatesControllerMessenger,
  TokenRatesControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;
  const preferencesState = initMessenger.call('PreferencesController:getState');

  const controller = new TokenRatesController({
    messenger: controllerMessenger,
    state: persistedState.TokenRatesController,
    tokenPricesService: new CodefiTokenPricesServiceV2(),
    disabled: !preferencesState.useCurrencyRateCheck,
  });

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useCurrencyRateCheck: prevUseCurrencyRateCheck } = prevState;
      const { useCurrencyRateCheck: currUseCurrencyRateCheck } = currState;
      if (currUseCurrencyRateCheck && !prevUseCurrencyRateCheck) {
        controller.enable();
      } else if (!currUseCurrencyRateCheck && prevUseCurrencyRateCheck) {
        controller.disable();
      }

      return true;
    }, preferencesState),
  );

  return {
    controller,
  };
};
