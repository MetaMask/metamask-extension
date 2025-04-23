import { escapeRegExp } from 'lodash';
import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';

/**
 * Determines whether the given RPC endpoint URL matches an Infura URL that uses
 * our API key.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @param infuraProjectId - Our Infura project ID.
 * @returns True if the URL is an Infura URL, false otherwise.
 */
export function getIsInfuraEndpointUrl(
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
export function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return Object.values(QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME)
    .map((getUrl) => getUrl())
    .includes(endpointUrl);
}
