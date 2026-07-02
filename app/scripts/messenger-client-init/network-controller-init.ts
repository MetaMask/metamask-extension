import {
  NetworkController,
  NetworkControllerMessenger,
} from '@metamask/network-controller';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../shared/constants/network';
import { isPublicEndpointUrl } from '../lib/util';
import { getRpcServiceEventsSampleRate } from '../lib/network-controller/utils';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.infuraProjectId - The Infura project ID to use.
 * @returns The initialized controller.
 */
export const NetworkControllerInit: MessengerClientInitFunction<
  NetworkController,
  NetworkControllerMessenger
> = ({ controllerMessenger, infuraProjectId, persistedState }) => {
  const messengerClient = new NetworkController({
    messenger: controllerMessenger,
    state: persistedState.NetworkController,
    infuraProjectId,
    failoverUrls: {
      [CHAIN_IDS.MAINNET]: getFailoverUrlsForInfuraNetwork('ethereum-mainnet'),
      [CHAIN_IDS.LINEA_MAINNET]:
        getFailoverUrlsForInfuraNetwork('linea-mainnet'),
      [CHAIN_IDS.ARBITRUM]: getFailoverUrlsForInfuraNetwork('arbitrum-mainnet'),
      [CHAIN_IDS.AVALANCHE]:
        getFailoverUrlsForInfuraNetwork('avalanche-mainnet'),
      [CHAIN_IDS.OPTIMISM]: getFailoverUrlsForInfuraNetwork('optimism-mainnet'),
      [CHAIN_IDS.POLYGON]: getFailoverUrlsForInfuraNetwork('polygon-mainnet'),
      [CHAIN_IDS.BASE]: getFailoverUrlsForInfuraNetwork('base-mainnet'),
      [CHAIN_IDS.SEI]: getFailoverUrlsForInfuraNetwork('sei-mainnet'),
      [CHAIN_IDS.MONAD]: getFailoverUrlsForInfuraNetwork('monad-mainnet'),
      [CHAIN_IDS.HYPE]: getFailoverUrlsForInfuraNetwork('hyperevm-mainnet'),
      [CHAIN_IDS.ARC]: getFailoverUrlsForInfuraNetwork('arc-mainnet'),
    },
    analytics: {
      isRpcEndpointUrlPublic: (endpointUrl) =>
        isPublicEndpointUrl(endpointUrl, infuraProjectId),
      rpcServiceEventsSampleRate: getRpcServiceEventsSampleRate(),
    },
  });

  messengerClient.init();

  return {
    messengerClient,
  };
};
