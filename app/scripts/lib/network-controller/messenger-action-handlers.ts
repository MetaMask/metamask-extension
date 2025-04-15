import { escapeRegExp } from 'lodash';
import { isConnectionError } from '@metamask/network-controller';
import log from 'loglevel';
import { Hex, hexToNumber } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { onlyKeepHost } from '../../../../shared/lib/only-keep-host';
import MetaMetricsController from '../../controllers/metametrics-controller';
import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';

/**
 * Handler for the `NetworkController:rpcEndpointUnavailable` messenger action,
 * which is called when an RPC endpoint cannot be reached or does not respond
 * successfully after a sufficient number of retries.
 *
 * In this case:
 *
 * - When we detect that Infura is down, we create an event in Segment so that
 * Quicknode can be automatically enabled.
 * - When we detect that Quicknode is down, we create an event in Segment so
 * that Quicknode can be automatically re-enabled.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.trackEvent - The function that will create the Segment event.
 */
export function onRpcEndpointUnavailable({
  chainId,
  endpointUrl,
  error,
  infuraProjectId,
  trackEvent,
}: {
  chainId: Hex;
  endpointUrl: string;
  error: unknown;
  infuraProjectId: string;
  trackEvent: MetaMetricsController['trackEvent'];
}): void {
  const isInfuraEndpointUrl = getIsInfuraEndpointUrl(
    endpointUrl,
    infuraProjectId,
  );
  const isQuicknodeEndpointUrl = getIsQuicknodeEndpointUrl(endpointUrl);
  if (
    (isInfuraEndpointUrl || isQuicknodeEndpointUrl) &&
    !isConnectionError(error)
  ) {
    log.debug(
      `Creating Segment event "${
        MetaMetricsEventName.RpcServiceUnavailable
      }" with chain_id_caip: "eip155:${chainId}", rpc_endpoint_url: ${onlyKeepHost(
        endpointUrl,
      )}`,
    );
    trackEvent({
      category: MetaMetricsEventCategory.Network,
      event: MetaMetricsEventName.RpcServiceUnavailable,
      properties: {
        chain_id_caip: `eip155:${hexToNumber(chainId)}`,
        rpc_endpoint_url: onlyKeepHost(endpointUrl),
      },
    });
  }
}

/**
 * Handler for the `NetworkController:rpcEndpointDegraded` messenger action,
 * which is called when an RPC endpoint is slow to return a successful response,
 * or it cannot be reached or does not respond successfully after some number of
 * retries.
 *
 * In this case, when we detect that Infura or Quicknode are degraded, we create
 * an event in Segment so that we know to investigate further.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.trackEvent - The function that will create the Segment event.
 */
export function onRpcEndpointDegraded({
  chainId,
  endpointUrl,
  infuraProjectId,
  trackEvent,
}: {
  chainId: Hex;
  endpointUrl: string;
  infuraProjectId: string;
  trackEvent: MetaMetricsController['trackEvent'];
}): void {
  const isInfuraEndpointUrl = getIsInfuraEndpointUrl(
    endpointUrl,
    infuraProjectId,
  );
  const isQuicknodeEndpointUrl = getIsQuicknodeEndpointUrl(endpointUrl);
  if (isInfuraEndpointUrl || isQuicknodeEndpointUrl) {
    log.debug(
      `Creating Segment event "${
        MetaMetricsEventName.RpcServiceDegraded
      }" with chain_id_caip: "eip155:${chainId}", rpc_endpoint_url: ${onlyKeepHost(
        endpointUrl,
      )}`,
    );
    trackEvent({
      category: MetaMetricsEventCategory.Network,
      event: MetaMetricsEventName.RpcServiceDegraded,
      properties: {
        chain_id_caip: `eip155:${hexToNumber(chainId)}`,
        rpc_endpoint_url: onlyKeepHost(endpointUrl),
      },
    });
  }
}

/**
 * Determines whether the given RPC endpoint URL matches an Infura URL that uses
 * our API key.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the URL is an Infura URL, false otherwise.
 */
function getIsInfuraEndpointUrl(
  endpointUrl: string,
  infuraProjectId: string,
): boolean {
  return new RegExp(
    `^https://[^.]+\\.infura\\.io/v3/${escapeRegExp(infuraProjectId)}$`,
    'u',
  ).test(endpointUrl);
}

/**
 * Determines whether the given RPC endpoint URL matches a known Quicknode URL.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the URL is a Quicknode URL, false otherwise.
 */
function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return Object.values(QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME)
    .map((getUrl) => getUrl())
    .includes(endpointUrl);
}
