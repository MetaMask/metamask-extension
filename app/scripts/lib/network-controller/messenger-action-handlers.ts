import log from 'loglevel';
import {
  type Hex,
  type Json,
  hexToNumber,
  isObject,
  isValidJson,
} from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { onlyKeepHost } from '../../../../shared/lib/only-keep-host';
import MetaMetricsController from '../../controllers/metametrics-controller';
import { shouldCreateRpcServiceEvents } from './utils';

/**
 * Called when an endpoint is determined to be "unavailable". Creates a Segment
 * event so we can understand failures better and so that we can automatically
 * activate Quicknode when Infura is down.
 *
 * Note that in production we do not create events *every* time an endpoint is
 * unavailable. In the case where the endpoint is truly down, this would create
 * millions of events and we would blow past our Segment quota. Instead we only
 * create an event 1% of the time.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 * @param args.trackEvent - The function that will create the Segment event.
 */
export function onRpcEndpointUnavailable({
  chainId,
  endpointUrl,
  error,
  infuraProjectId,
  metaMetricsId,
  trackEvent,
}: {
  chainId: Hex;
  endpointUrl: string;
  error: unknown;
  infuraProjectId: string;
  metaMetricsId: string | null;
  trackEvent: MetaMetricsController['trackEvent'];
}): void {
  trackRpcEndpointEvent(MetaMetricsEventName.RpcServiceUnavailable, {
    chainId,
    endpointUrl,
    error,
    infuraProjectId,
    metaMetricsId,
    trackEvent,
  });
}

/**
 * Called when an endpoint is determined to be "degraded". Creates a Segment
 * event so we can understand failures better.
 *
 * Note that in production we do not create events *every* time an endpoint is
 * unavailable. In the case where the endpoint is down, this would create
 * millions of events and we would blow past our Segment quota. Instead we only
 * create an event 1% of the time.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 * @param args.trackEvent - The function that will create the Segment event.
 */
export function onRpcEndpointDegraded({
  chainId,
  endpointUrl,
  error,
  infuraProjectId,
  metaMetricsId,
  trackEvent,
}: {
  chainId: Hex;
  endpointUrl: string;
  error: unknown;
  infuraProjectId: string;
  metaMetricsId: string | null;
  trackEvent: MetaMetricsController['trackEvent'];
}): void {
  trackRpcEndpointEvent(MetaMetricsEventName.RpcServiceDegraded, {
    chainId,
    endpointUrl,
    error,
    infuraProjectId,
    metaMetricsId,
    trackEvent,
  });
}

/**
 * Creates a Segment event when an RPC endpoint is determined to be degraded or
 * unavailable.
 *
 * @param event - The Segment event to create.
 * @param args - The remaining arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 * @param args.trackEvent - The function that will create the Segment event.
 */
export function trackRpcEndpointEvent(
  event: string,
  {
    chainId,
    endpointUrl,
    error,
    infuraProjectId,
    trackEvent,
    metaMetricsId,
  }: {
    chainId: Hex;
    endpointUrl: string;
    error: unknown;
    infuraProjectId: string;
    trackEvent: MetaMetricsController['trackEvent'];
    metaMetricsId: string | null;
  },
): void {
  if (
    !shouldCreateRpcServiceEvents({
      endpointUrl,
      error,
      infuraProjectId,
      metaMetricsId,
    })
  ) {
    return;
  }

  // The names of Segment properties have a particular case.
  /* eslint-disable @typescript-eslint/naming-convention */
  const properties = {
    chain_id_caip: `eip155:${hexToNumber(chainId)}`,
    rpc_endpoint_url: onlyKeepHost(endpointUrl),
    ...(isObject(error) &&
    'httpStatus' in error &&
    isValidJson(error.httpStatus)
      ? { http_status: error.httpStatus }
      : {}),
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  log.debug(
    `Creating Segment event "${event}" with ${JSON.stringify(properties)}`,
  );
  trackEvent({
    category: MetaMetricsEventCategory.Network,
    event,
    properties,
  });
}
