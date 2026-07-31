import { WalletOptions } from '@metamask/wallet';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../../shared/constants/network';
import { isPublicEndpointUrl } from '../../lib/util';
import { getRpcServiceEventsSampleRate } from '../../lib/network-controller/utils';

export function getNetworkControllerInstanceOptions(
  infuraProjectId: string,
): WalletOptions['instanceOptions']['networkController'] {
  return {
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
    analyticsOptions: {
      isRpcEndpointUrlPublic: (endpointUrl) =>
        isPublicEndpointUrl(endpointUrl, infuraProjectId),
      rpcServiceEventsSampleRate: getRpcServiceEventsSampleRate(),
    },
  };
}
