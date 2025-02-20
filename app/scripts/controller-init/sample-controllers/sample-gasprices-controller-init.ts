import {
  GasPricesController as SampleGasPricesController,
  GasPricesControllerMessenger as SampleGasPricesControllerMessenger,
  GasPricesControllerState as SampleGasPricesControllerState,
} from '@metamask/sample-controllers';
import { ControllerInitFunction } from '../types';

export const SampleGasPricesControllerInit: ControllerInitFunction<
  SampleGasPricesController,
  SampleGasPricesControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SampleGasPricesController({
    messenger: controllerMessenger,
    state: persistedState as unknown as Partial<SampleGasPricesControllerState>,
  });

  return {
    controller,
  };
};
