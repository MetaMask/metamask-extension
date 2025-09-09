import { AccountActivityService, WebSocketService as BackendWebSocketService } from '@metamask/backend-platform';
import { ControllerInitFunction } from '../types';
import { AccountActivityServiceMessenger } from '../messengers/backend-platform';

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
> = ({ controllerMessenger, getController }) => {
  // Get the BackendWebSocketService that was already initialized
  const webSocketService = getController('BackendWebSocketService') as BackendWebSocketService;

  const controller = new AccountActivityService({
    messenger: controllerMessenger,
    webSocketService,
    // TODO: Add extension-specific configuration when backend-platform is updated:
    // maxConcurrentSubscriptions: 50, // Conservative limit for extension environment
    // subscriptionNamespace: 'account-activity.v1', // Use default namespace
  });

  return {
    memStateKey: null,
    persistedStateKey: 'AccountActivityService',
    controller,
  };
};
