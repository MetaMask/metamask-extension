import { RewardsMoneyDataService } from '../controllers/rewards-money/rewards-money-data-service';
import { RewardsMoneyDataServiceMessenger } from '../controllers/rewards-money/rewards-money-data-service-types';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Rewards Money data service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const RewardsMoneyDataServiceInit: MessengerClientInitFunction<
  RewardsMoneyDataService,
  RewardsMoneyDataServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new RewardsMoneyDataService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
