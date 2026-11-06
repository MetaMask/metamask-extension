import { WatchOnlyAccountService } from '@metamask/watch-only-account-service';
import { getIsWatchOnlyAccountEnabled } from '../../../../shared/lib/environment';
import type { MessengerClientInitFunction } from '../types';
import { WatchOnlyAccountServiceMessenger } from '../messengers/accounts';

/**
 * Initialize the watch-only account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const WatchOnlyAccountServiceInit: MessengerClientInitFunction<
  WatchOnlyAccountService,
  WatchOnlyAccountServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new WatchOnlyAccountService({
    messenger: controllerMessenger,
    enabled: getIsWatchOnlyAccountEnabled(),
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient: service,
  };
};
