import { WalletOptions } from '@metamask/wallet';
import { getFailoverUrlsByChainId } from '../../../../shared/constants/network-failover';
import { isPublicEndpointUrl } from '../../lib/util';
import { getRpcServiceEventsSampleRate } from '../../lib/network-controller/utils';

export function getNetworkControllerInstanceOptions(
  infuraProjectId: string,
): WalletOptions['instanceOptions']['networkController'] {
  return {
    infuraProjectId,
    failoverUrls: getFailoverUrlsByChainId(),
    analyticsOptions: {
      isRpcEndpointUrlPublic: (endpointUrl) =>
        isPublicEndpointUrl(endpointUrl, infuraProjectId),
      rpcServiceEventsSampleRate: getRpcServiceEventsSampleRate(),
    },
  };
}
