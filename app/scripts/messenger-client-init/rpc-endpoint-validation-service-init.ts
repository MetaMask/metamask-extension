import {
  RpcEndpointValidationService,
  type RpcEndpointValidationServiceMessenger,
} from '../services/rpc-endpoint-validation-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the isolated, fixed-method RPC validation service.
 * @param options0
 * @param options0.controllerMessenger
 * @param options0.networkPolicy
 */
export const RpcEndpointValidationServiceInit: MessengerClientInitFunction<
  RpcEndpointValidationService,
  RpcEndpointValidationServiceMessenger
> = ({ controllerMessenger, networkPolicy }) => {
  const messengerClient = new RpcEndpointValidationService({
    messenger: controllerMessenger,
    ...(networkPolicy
      ? {
          allowRpcValidation: (details: { tabId: number; url: string }) =>
            networkPolicy.allowRpcValidation(details),
        }
      : {}),
  });
  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
    api: {
      validateRpcEndpoint:
        messengerClient.validateRpcEndpoint.bind(messengerClient),
    },
  };
};
