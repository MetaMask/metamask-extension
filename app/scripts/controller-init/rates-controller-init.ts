import { RatesController } from '@metamask/assets-controllers';
import { RatesControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the rates controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const RatesControllerInit: ControllerInitFunction<
  RatesController,
  RatesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new RatesController({
    // @ts-expect-error: `RatesController` is persisted as
    // `MultichainRatesController`, but the controller init pattern doesn't
    // allow this in the type of `persistedState`.
    state: persistedState.MultichainRatesController,
    messenger: controllerMessenger,
    includeUsdRate: true,
  });

  return {
    memStateKey: 'MultichainRatesController',
    persistedStateKey: 'MultichainRatesController',
    controller,
  };
};
