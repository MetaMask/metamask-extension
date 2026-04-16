import {
  AccountActivityService,
  AccountActivityServiceMessenger,
} from '@metamask/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the Account Activity service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const AccountActivityServiceInit: MessengerClientInitFunction<
  AccountActivityService,
  AccountActivityServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new AccountActivityService({
    messenger: controllerMessenger,
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    traceFn: trace,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
