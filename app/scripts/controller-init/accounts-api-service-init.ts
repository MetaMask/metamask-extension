import type { AccountsApiServiceMessenger } from '@metamask-previews/accounts-api';
import { AccountsApiService } from '@metamask-previews/accounts-api';

import type { ControllerInitFunction } from './types';

/**
 * Initialize the Accounts API service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const AccountsApiServiceInit: ControllerInitFunction<
  AccountsApiService,
  AccountsApiServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new AccountsApiService({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller: service,
  };
};
