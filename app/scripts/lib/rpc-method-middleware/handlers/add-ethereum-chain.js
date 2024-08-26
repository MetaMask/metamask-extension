import { ApprovalType } from '@metamask/controller-utils';

import { RpcEndpointType } from '@metamask/network-controller';
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

  // todo: consider maintaining this logic
  // if (
  //   existingNetwork &&
  //   existingNetwork.chainId === chainId &&
  //   existingNetwork.ticker !== ticker
  // ) {
  //   return end(
  //     ethErrors.rpc.invalidParams({
  //       message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
  //     }),
  //   );
  // }

  // TODO: consider checking if the rpc url already exists for the network.
  // in that case, we can just lookup its network client id and switch to it
  // No need to add or update any networks
  //
  // Additionally we may need to check if it exists *across all chain ids*,
  // since the network controller won't let duplicates be added

  let updatedNetwork;

  // eslint-disable-next-line no-constant-condition
  const { id: approvalFlowId } = await startApprovalFlow();

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

    // eslint-disable-next-line no-negated-condition
    if (!existingNetwork) {
      updatedNetwork = await addNetwork({
        blockExplorerUrls: firstValidBlockExplorerUrl
          ? [firstValidBlockExplorerUrl]
          : [],
        defaultBlockExplorerUrlIndex: firstValidBlockExplorerUrl
          ? 0
          : undefined,
        chainId,
        defaultRpcEndpointIndex: 0,
        name: chainName, // todo: consider using the canonical chain name here,
        //  and put this as rpc endpoint name instead???
        nativeCurrency: ticker,
        rpcEndpoints: [
          {
            url: firstValidRPCUrl,
            // name:
            type: RpcEndpointType.Custom,
          },
        ],
      });
    } else {
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

      const options =
        currentChainId === chainId
          ? {
              replacementSelectedRpcEndpointIndex:
                clonedNetwork.defaultRpcEndpointIndex,
            }
          : undefined;

      // TODO: Merge logic - should new or old data take precedence?
      // Or use a cononical network name/ticker if conflicting

      updatedNetwork = await updateNetwork(
        clonedNetwork.chainId,
        clonedNetwork,
        options,
      );
    }
  } catch (error) {
    endApprovalFlow({ id: approvalFlowId });
    return end(error);
  }

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
