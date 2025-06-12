import { MultichainNetworkService } from '@metamask/multichain-network-controller';

/**
 * Initialize the Multichain Network service controller.
 *
 * @returns The initialized controller.
 */

export const MultichainNetworkServiceInit = (): MultichainNetworkService =>
  new MultichainNetworkService({
    fetch: window.fetch.bind(window),
  });
