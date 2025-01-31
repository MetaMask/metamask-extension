import { SnapInsightsController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SnapInsightsControllerMessenger } from './snap-insights-controller-messenger';

export const SnapInsightsControllerInit: ControllerInitFunction<
  SnapInsightsController,
  SnapInsightsControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SnapInsightsController({
    // @ts-expect-error: `persistedState.CronjobController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInsightsController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
