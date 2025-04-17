import { MultichainNetworkService } from '@metamask/multichain-network-controller';
// import fetchWithCache from '../../../../shared/lib/fetch-with-cache';

/**
 * Initialize the Multichain Network service controller.
 *
 * @returns The initialized controller.
 */
export const MultichainNetworkServiceInit = (): MultichainNetworkService => {
  return new MultichainNetworkService({
    fetch: window.fetch.bind(window),
  });
};
