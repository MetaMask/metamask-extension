import {
  UserTraitsService,
  UserTraitsServiceMessenger,
} from '../services/user-traits-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the user traits service.
 *
 * The service derives MetaMetrics user traits from the full MetaMask state and
 * forwards any changes to the analytics pipeline. It holds no persisted state of
 * its own, so it is neither persisted nor synchronized with the UI.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const UserTraitsServiceInit: MessengerClientInitFunction<
  UserTraitsService,
  UserTraitsServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new UserTraitsService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
