import {
  NetworkClientType,
  type NetworkClientConfiguration,
} from '@metamask/network-controller';
import { getFailoverUrlsByChainId } from '../../../../shared/constants/network-failover';
import { isPublicEndpointUrl } from '../../lib/util';
import { getRpcServiceEventsSampleRate } from '../../lib/network-controller/utils';

export function getNetworkControllerInstanceOptions(infuraProjectId: string) {
  return {
    infuraProjectId,
    failoverUrls: getFailoverUrlsByChainId(),
    getBlockTrackerOptions: (
      _rpcEndpointUrl: string,
      configuration: Readonly<NetworkClientConfiguration>,
    ) =>
      process.env.IN_TEST && configuration.type === NetworkClientType.Custom
        ? { pollingInterval: 1000 }
        : {},
    analyticsOptions: {
      isRpcEndpointUrlPublic: (endpointUrl: string) =>
        isPublicEndpointUrl(endpointUrl, infuraProjectId),
      rpcServiceEventsSampleRate: getRpcServiceEventsSampleRate(),
    },
  };
}
