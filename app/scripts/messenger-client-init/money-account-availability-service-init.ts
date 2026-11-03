import {
  MoneyAccountAvailabilityService,
  MoneyAccountAvailabilityMessenger,
} from '../lib/money/money-account-availability';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the MoneyAccountAvailabilityService.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const MoneyAccountAvailabilityServiceInit: MessengerClientInitFunction<
  MoneyAccountAvailabilityService,
  MoneyAccountAvailabilityMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new MoneyAccountAvailabilityService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
