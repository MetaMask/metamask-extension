import { RewardsDataService } from '../controllers/rewards/rewards-data-service';
import { RewardsDataServiceMessenger } from '../controllers/rewards/rewards-data-service-types';
import { MessengerClientInitFunction } from './types';

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
export const RewardsDataServiceInit: MessengerClientInitFunction<
  RewardsDataService,
  RewardsDataServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new RewardsDataService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
