import { providerErrors } from '@metamask/rpc-errors';
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
    getCaveat: true,
    requestPermittedChainsPermission: true,
    getCurrentChainIdForDomain: true,
    grantPermittedChainsPermissionIncremental: true,
    requestUserApproval: true,
    hasApprovalRequestsForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
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
    requestPermittedChainsPermission,
    getCaveat,
    getCurrentChainIdForDomain,
    grantPermittedChainsPermissionIncremental,
    requestUserApproval,
    hasApprovalRequestsForOrigin,
    rejectApprovalRequestsForOrigin,
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

  const fromNetworkConfiguration = getNetworkConfigurationByChainId(
    currentChainIdForOrigin,
  );

  const toNetworkConfiguration = getNetworkConfigurationByChainId(chainId);

  const networkClientIdToSwitchTo =
    toNetworkConfiguration?.rpcEndpoints[
      toNetworkConfiguration.defaultRpcEndpointIndex
    ].networkClientId;

  if (!networkClientIdToSwitchTo) {
    return end(
      providerErrors.custom({
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  return switchChain({
    res,
    end,
    chainId,
    networkClientId: networkClientIdToSwitchTo,
    fromNetworkConfiguration,
    toNetworkConfiguration,
    origin,
    hooks: {
      setActiveNetwork,
      getCaveat,
      requestPermittedChainsPermission,
      grantPermittedChainsPermissionIncremental,
      requestUserApproval,
      hasApprovalRequestsForOrigin,
      rejectApprovalRequestsForOrigin,
    },
  });
}
