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
    getCurrentRpcUrl: true,
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

  if (
    existingNetwork?.rpcEndpoints?.some(({ url }) => url === firstValidRPCUrl)
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `The RPC URL ${firstValidRPCUrl} is already defined on the network with chainId ${chainId}`,
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
      // Update it with the new RPC endpoint and/or block explorer.

      const clonedNetwork = { ...existingNetwork };
      clonedNetwork.rpcEndpoints = [
        ...clonedNetwork.rpcEndpoints,
        {
          url: firstValidRPCUrl,
          type: RpcEndpointType.Custom,
          name: chainName,
        },
      ];

      clonedNetwork.defaultRpcEndpointIndex =
        clonedNetwork.rpcEndpoints.length - 1;

      if (
        !clonedNetwork.blockExplorerUrls.includes(firstValidBlockExplorerUrl)
      ) {
        clonedNetwork.blockExplorerUrls = [
          ...clonedNetwork.blockExplorerUrls,
          firstValidBlockExplorerUrl,
        ];
      }

      clonedNetwork.defaultBlockExplorerUrlIndex =
        clonedNetwork.blockExplorerUrls.length - 1;

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
