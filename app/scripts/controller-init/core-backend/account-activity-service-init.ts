import {
  AccountActivityService,
  AccountActivityServiceMessenger,
} from '@metamask/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { ControllerInitFunction } from '../types';

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
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    traceFn: trace,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
