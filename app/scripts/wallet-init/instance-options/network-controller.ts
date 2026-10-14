import { NetworkClientType } from '@metamask/network-controller';
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
    getBlockTrackerOptions: (_rpcEndpointUrl, configuration) =>
      process.env.IN_TEST && configuration.type === NetworkClientType.Custom
        ? { pollingInterval: 1000 }
        : {},
    analyticsOptions: {
      isRpcEndpointUrlPublic: (endpointUrl) =>
        isPublicEndpointUrl(endpointUrl, infuraProjectId),
      rpcServiceEventsSampleRate: getRpcServiceEventsSampleRate(),
    },
  };
}
