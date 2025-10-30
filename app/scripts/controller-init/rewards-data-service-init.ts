import { RewardsDataService } from '../controllers/rewards/rewards-data-service';
import type { RewardsDataServiceMessenger } from './messengers/reward-data-service-messenger';
import { ControllerInitFunction } from './types';

/**
 * Initialize the rewards data service.
 *
 * The service will dynamically retrieve the user's locale from PreferencesController
 * at runtime, ensuring it always uses the current language setting.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const RewardsDataServiceInit: ControllerInitFunction<
  RewardsDataService,
  RewardsDataServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new RewardsDataService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
  });

  return {
    controller,
  };
};
