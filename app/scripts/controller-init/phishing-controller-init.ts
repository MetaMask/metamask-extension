import { PhishingController } from '@metamask/phishing-controller';
import { Duration, inMilliseconds } from '@metamask/utils';
import { ControllerInitFunction } from './types';
import { PhishingControllerMessenger } from './messengers';

/**
 * Initialize the phishing controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const PhishingControllerInit: ControllerInitFunction<
  PhishingController,
  PhishingControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new PhishingController({
    messenger: controllerMessenger,
    state: persistedState.PhishingController,
    hotlistRefreshInterval: process.env.IN_TEST
      ? inMilliseconds(5, Duration.Second)
      : undefined,
    stalelistRefreshInterval: process.env.IN_TEST
      ? inMilliseconds(30, Duration.Second)
      : undefined,
  });

  return {
    controller,
  };
};
