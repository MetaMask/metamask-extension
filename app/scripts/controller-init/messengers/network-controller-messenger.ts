import { Messenger } from '@metamask/base-controller';
import type { ErrorReportingServiceCaptureExceptionAction } from '@metamask/error-reporting-service';
import {
  NetworkControllerRpcEndpointDegradedEvent,
  NetworkControllerRpcEndpointUnavailableEvent,
} from '@metamask/network-controller';
import {
  MetaMetricsControllerGetMetaMetricsIdAction,
  MetaMetricsControllerTrackEventAction,
} from '../../controllers/metametrics-controller';

type AllowedActions = ErrorReportingServiceCaptureExceptionAction;

export type NetworkControllerMessenger = ReturnType<
  typeof getNetworkControllerMessenger
>;

/**
 * Get a messenger restricted to actions the NetworkController needs.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'NetworkController',
    allowedActions: ['ErrorReportingService:captureException'],
    allowedEvents: [],
  });
}

type AllowedInitializationActions =
  | MetaMetricsControllerGetMetaMetricsIdAction
  | MetaMetricsControllerTrackEventAction;

type AllowedInitializationEvents =
  | NetworkControllerRpcEndpointUnavailableEvent
  | NetworkControllerRpcEndpointDegradedEvent;

export type NetworkControllerInitMessenger = ReturnType<
  typeof getNetworkControllerInitMessenger
>;

/**
 * Get a messenger restricted to actions the NetworkController needs during
 * initialization.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'NetworkControllerInit',
    allowedActions: [
      'MetaMetricsController:getMetaMetricsId',
      'MetaMetricsController:trackEvent',
    ],
    allowedEvents: [
      'NetworkController:rpcEndpointUnavailable',
      'NetworkController:rpcEndpointDegraded',
    ],
  });
}
