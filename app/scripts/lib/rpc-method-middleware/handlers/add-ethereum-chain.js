import { ethErrors } from 'eth-rpc-errors';
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
    getCurrentRpcUrl,
    getNetworkConfigurationByChainId,
    setActiveNetwork,
    requestUserApproval,
    startApprovalFlow,
    endApprovalFlow,
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

  const currentChainIdForDomain = getCurrentChainIdForDomain(origin);
  const currentNetworkConfiguration = getNetworkConfigurationByChainId(
    currentChainIdForDomain,
  );
  const existingNetwork = getNetworkConfigurationByChainId(chainId);

  // todo: consider if this is still necessary
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

  let networkClientId;
  let requestData;
  let approvalFlowId;

  // TODO: consider checking if the rpc url already exists for the network.
  // in that case, we can just lookup its network client id and switch to it
  // No need to add or update any networks
  if (true) {
    ({ id: approvalFlowId } = await startApprovalFlow());

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

      if (!existingNetwork) {
        const addedNetwork = await addNetwork({
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
        networkClientId = addedNetwork.rpcEndpoints[0].networkClientId;
      } else {
        // todo implement update
      }
    } catch (error) {
      endApprovalFlow({ id: approvalFlowId });
      return end(error);
    }

    requestData = {
      toNetworkConfiguration: {
        rpcUrl: firstValidRPCUrl,
        chainId,
        nickname: chainName,
        ticker,
        networkClientId,
      },
      fromNetworkConfiguration: currentNetworkConfiguration,
    };
  } else {
    // TODO implement me
    // networkClientId = existingNetwork.id ?? existingNetwork.type;
    // const currentRpcUrl = getCurrentRpcUrl();

    // if (
    //   currentChainIdForDomain === chainId &&
    //   currentRpcUrl === firstValidRPCUrl
    // ) {
    //   return end();
    // }

    // requestData = {
    //   toNetworkConfiguration: existingNetwork,
    //   fromNetworkConfiguration: currentNetworkConfiguration,
    // };
  }

  // TODO: `requestData` is using the net network configuration format, not expected by
  // `switchChain`. Consider whether easier to move it to new format, or transform here
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
