import { ethErrors } from 'eth-rpc-errors';
import { ApprovalType } from '@metamask/controller-utils';

import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  findExistingNetwork,
  validateAddEthereumChainParams,
  switchChain,
} from './ethereum-chain-utils';

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
  hookNames: {
    upsertNetworkConfiguration: true,
    getCurrentRpcUrl: true,
    findNetworkConfigurationBy: true,
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
    upsertNetworkConfiguration,
    getCurrentRpcUrl,
    findNetworkConfigurationBy,
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
  const validParams = validateAddEthereumChainParams(req.params[0], end);
  if (!validParams) {
    return end();
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
  const currentNetworkConfiguration = findExistingNetwork(
    currentChainIdForDomain,
    findNetworkConfigurationBy,
  );

  const existingNetwork = findExistingNetwork(
    chainId,
    findNetworkConfigurationBy,
  );

  if (
    existingNetwork &&
    existingNetwork.chainId === chainId &&
    existingNetwork.ticker !== ticker
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
      }),
    );
  }

  let networkConfigurationId;
  let requestData;
  let approvalFlowId;

  if (!existingNetwork || existingNetwork.rpcUrl !== firstValidRPCUrl) {
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

      networkConfigurationId = await upsertNetworkConfiguration(
        {
          chainId,
          rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
          nickname: chainName,
          rpcUrl: firstValidRPCUrl,
          ticker,
        },
        { source: 'dapp', referrer: origin },
      );
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
        networkConfigurationId,
      },
      fromNetworkConfiguration: currentNetworkConfiguration,
    };
  } else {
    networkConfigurationId = existingNetwork.id ?? existingNetwork.type;
    const currentRpcUrl = getCurrentRpcUrl();

    if (
      currentChainIdForDomain === chainId &&
      currentRpcUrl === firstValidRPCUrl
    ) {
      return end();
    }

    requestData = {
      toNetworkConfiguration: existingNetwork,
      fromNetworkConfiguration: currentNetworkConfiguration,
    };
  }

  return switchChain(
    res,
    end,
    origin,
    chainId,
    requestData,
    networkConfigurationId,
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
