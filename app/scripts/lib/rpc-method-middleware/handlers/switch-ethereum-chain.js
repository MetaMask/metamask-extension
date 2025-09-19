import { providerErrors } from '@metamask/rpc-errors';
import { isSnapId } from '@metamask/snaps-utils';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  validateSwitchEthereumChainParams,
  switchChain,
} from './ethereum-chain-utils';

const switchEthereumChain = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: switchEthereumChainHandler,
  hookNames: {
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCaveat: true,
    getCurrentChainIdForDomain: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
    setTokenNetworkFilter: true,
    setEnabledNetworks: true,
    setEnabledNetworksMultichain: true,
    getEnabledNetworks: true,
    hasApprovalRequestsForOrigin: true,
  },
};

export default switchEthereumChain;

async function switchEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    getNetworkConfigurationByChainId,
    setActiveNetwork,
    requestUserApproval,
    getCaveat,
    getCurrentChainIdForDomain,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    setEnabledNetworksMultichain,
    getEnabledNetworks,
    hasApprovalRequestsForOrigin,
  },
) {
  let chainId;
  try {
    chainId = validateSwitchEthereumChainParams(req);
  } catch (error) {
    return end(error);
  }

  const { origin } = req;
  const currentChainIdForOrigin = getCurrentChainIdForDomain(origin);
  if (currentChainIdForOrigin === chainId) {
    res.result = null;
    return end();
  }

  const networkConfigurationForRequestedChainId =
    getNetworkConfigurationByChainId(chainId);
  const networkClientIdToSwitchTo =
    networkConfigurationForRequestedChainId?.rpcEndpoints[
      networkConfigurationForRequestedChainId.defaultRpcEndpointIndex
    ].networkClientId;

  if (!networkClientIdToSwitchTo) {
    return end(
      providerErrors.custom({
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  const fromNetworkConfiguration = getNetworkConfigurationByChainId(
    currentChainIdForOrigin,
  );

  const toNetworkConfiguration = getNetworkConfigurationByChainId(chainId);

  return switchChain(res, end, chainId, networkClientIdToSwitchTo, {
    origin,
    isSwitchFlow: true,
    autoApprove: isSnapId(origin),
    setActiveNetwork,
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    setEnabledNetworksMultichain,
    getEnabledNetworks,
    requestUserApproval,
    hasApprovalRequestsForOrigin,
    toNetworkConfiguration,
    fromNetworkConfiguration,
  });
}
