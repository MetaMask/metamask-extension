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
    getCurrentChainIdForDomain: true,
    requestPermittedChainsPermissionForOrigin: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
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
    getCaveat,
    getCurrentChainIdForDomain,
    requestPermittedChainsPermissionForOrigin,
    requestPermittedChainsPermissionIncrementalForOrigin,
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

  return switchChain(res, end, chainId, networkClientIdToSwitchTo, null, {
    setActiveNetwork,
    getCaveat,
    requestPermittedChainsPermissionForOrigin,
    requestPermittedChainsPermissionIncrementalForOrigin,
  });
}
