import { ApprovalType } from '@metamask/controller-utils';

import { RpcEndpointType } from '@metamask/network-controller';
import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  validateAddEthereumChainParams,
  switchChain,
} from './ethereum-chain-utils';

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
  hookNames: {
    addNetwork: true,
    updateNetwork: true,
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    startApprovalFlow: true,
    endApprovalFlow: true,
    getCurrentChainId: true,
    getCurrentChainIdForDomain: true,
    getCaveat: true,
    requestPermittedChainsPermission: true,
    getChainPermissionsFeatureFlag: true,
  },
};

export default addEthereumChain;

async function addEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    addNetwork,
    updateNetwork,
    getNetworkConfigurationByChainId,
    setActiveNetwork,
    requestUserApproval,
    startApprovalFlow,
    endApprovalFlow,
    getCurrentChainId,
    getCurrentChainIdForDomain,
    getCaveat,
    requestPermittedChainsPermission,
    getChainPermissionsFeatureFlag,
  },
) {
  let validParams;
  try {
    validParams = validateAddEthereumChainParams(req.params[0], end);
  } catch (error) {
    return end(error);
  }

  const {
    chainId,
    chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  } = validParams;
  const { origin } = req;

  const currentChainId = getCurrentChainId();
  const currentChainIdForDomain = getCurrentChainIdForDomain(origin);
  const currentNetworkConfiguration = getNetworkConfigurationByChainId(
    currentChainIdForDomain,
  );
  const existingNetwork = getNetworkConfigurationByChainId(chainId);

  if (
    existingNetwork &&
    existingNetwork.chainId === chainId &&
    existingNetwork.nativeCurrency !== ticker
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
      }),
    );
  }

  const { id: approvalFlowId } = await startApprovalFlow();

  let updatedNetwork;

  try {
    await requestUserApproval({
      origin,
      type: ApprovalType.AddEthereumChain,
      requestData: {
        chainId,
        rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
        chainName,
        rpcUrl: firstValidRPCUrl,
        ticker,
      },
    });

    if (existingNetwork) {
      // A network for this chain id already exists.
      // Update it with any new information.

      const clonedNetwork = { ...existingNetwork };

      // Check if the rpc url already exists
      let rpcIndex = clonedNetwork.rpcEndpoints.findIndex(
        ({ url }) => url === firstValidRPCUrl,
      );

      // If it doesn't exist, add a new one
      if (rpcIndex === -1) {
        clonedNetwork.rpcEndpoints = [
          ...clonedNetwork.rpcEndpoints,
          {
            url: firstValidRPCUrl,
            type: RpcEndpointType.Custom,
            name: chainName,
          },
        ];
        rpcIndex = clonedNetwork.rpcEndpoints.length - 1;
      }

      // The provided rpc endpoint becomes the default
      clonedNetwork.defaultRpcEndpointIndex = rpcIndex;

      // Check if the block explorer already exists
      let blockExplorerIndex = clonedNetwork.blockExplorerUrls.findIndex(
        (url) => url === firstValidBlockExplorerUrl,
      );

      // If it doesn't exist, add a new one
      if (blockExplorerIndex === -1) {
        clonedNetwork.blockExplorerUrls = [
          ...clonedNetwork.blockExplorerUrls,
          firstValidBlockExplorerUrl,
        ];
        blockExplorerIndex = clonedNetwork.blockExplorerUrls.length - 1;
      }

      // The provided block explorer becomes the default
      clonedNetwork.defaultBlockExplorerUrlIndex = blockExplorerIndex;

      updatedNetwork = await updateNetwork(
        clonedNetwork.chainId,
        clonedNetwork,
        currentChainId === chainId
          ? {
              replacementSelectedRpcEndpointIndex:
                clonedNetwork.defaultRpcEndpointIndex,
            }
          : undefined,
      );
    } else {
      // A network for this chain id does not exist, so add a new network
      updatedNetwork = await addNetwork({
        blockExplorerUrls: firstValidBlockExplorerUrl
          ? [firstValidBlockExplorerUrl]
          : [],
        defaultBlockExplorerUrlIndex: firstValidBlockExplorerUrl
          ? 0
          : undefined,
        chainId,
        defaultRpcEndpointIndex: 0,
        name: chainName,
        nativeCurrency: ticker,
        rpcEndpoints: [
          {
            url: firstValidRPCUrl,
            name: chainName,
            type: RpcEndpointType.Custom,
          },
        ],
      });
    }
  } catch (error) {
    endApprovalFlow({ id: approvalFlowId });
    return end(error);
  }

  // If the added or updated network is not the current chain, prompt the user to switch
  if (chainId !== currentChainId) {
    const { networkClientId } =
      updatedNetwork.rpcEndpoints[updatedNetwork.defaultRpcEndpointIndex];

    const requestData = {
      toNetworkConfiguration: {
        rpcUrl: firstValidRPCUrl,
        chainId,
        nickname: chainName,
        ticker,
        networkClientId,
      },
      fromNetworkConfiguration: currentNetworkConfiguration,
    };

    return switchChain(
      res,
      end,
      origin,
      chainId,
      requestData,
      networkClientId,
      approvalFlowId,
      {
        getChainPermissionsFeatureFlag,
        setActiveNetwork,
        requestUserApproval,
        getCaveat,
        requestPermittedChainsPermission,
        endApprovalFlow,
      },
    );
  }
  endApprovalFlow({ id: approvalFlowId });
  return end();
}
