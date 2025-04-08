import { MultichainNetworkServiceController } from '@metamask/multichain-network-controller';
// import fetchWithCache from '../../../../shared/lib/fetch-with-cache';

/**
 * Initialize the Multichain Network service controller.
 *
 * @param fetch - The fetch function to use for the controller.
 * @returns The initialized controller.
 */
export const MultichainNetworkServiceControllerInit =
  (): MultichainNetworkServiceController => {
    return new MultichainNetworkServiceController({
      fetch: window.fetch.bind(window),
    });
  };
