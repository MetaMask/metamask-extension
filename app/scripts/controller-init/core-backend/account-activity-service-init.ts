import { AccountActivityService } from '@metamask/core-backend';
import { ControllerInitFunction } from '../types';
import { AccountActivityServiceMessenger } from '../messengers/core-backend';

/**
 * Initialize the Account Activity service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const AccountActivityServiceInit: ControllerInitFunction<
  AccountActivityService,
  AccountActivityServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new AccountActivityService({
    messenger: controllerMessenger,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
