import { AccountActivityService } from '@metamask/backend-platform';
import { ControllerInitFunction } from '../types';
import { AccountActivityServiceMessenger } from '../messengers/backend-platform';

/**
 * Initialize the Account Activity service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.controllers - The controllers object containing the WebSocketService.
 * @returns The initialized service.
 */
export const AccountActivityServiceInit: ControllerInitFunction<
  AccountActivityService,
  AccountActivityServiceMessenger
> = ({ controllerMessenger, getController }) => {
  // Get the WebSocketService from the controllers
  const webSocketService = getController('WebSocketService');

  const controller = new AccountActivityService({
    messenger: controllerMessenger,
    webSocketService,
    maxAddressesPerSubscription: 50,
    maxActiveSubscriptions: 20,
    processAllTransactions: true,
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
