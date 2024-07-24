import { ethErrors } from 'eth-rpc-errors';
import type {
  JsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from 'json-rpc-engine';
import type {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  JsonRpcParams,
  Hex,
} from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import {
  AddApprovalOptions,
  ApprovalFlowStartResult,
  EndFlowOptions,
  StartFlowOptions,
} from '@metamask/approval-controller';
import { Domain } from '@metamask/selected-network-controller';
import {
  NetworkConfiguration,
  ProviderConfig,
} from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerWrapper } from './types';
import {
  findExistingNetwork,
  switchChain,
  validateAddEthereumChainParams,
} from './ethereum-chain-utils';

export type UpsertNetworkConfigurationOptions = {
  referrer: string;
  source: string;
  setActive?: boolean;
};

type EndApprovalFlow = ({ id }: EndFlowOptions) => void;
type FindNetworkConfigurationBy = (
  rpcInfo: Record<string, string>,
) => ProviderConfig | null;
type GetCaveat = (target: string, caveatType: string) => string[] | undefined;
type GetChainPermissionsFeatureFlag = () => boolean;
type GetCurrentChainIdForDomain = (domain: Domain) => Hex;
type GetCurrentRpcUrl = () => string | undefined;
type RequestPermittedChainsPermission = (chainIds: string[]) => Promise<void>;
type RequestUserApproval = (options?: AddApprovalOptions) => Promise<unknown>;
type SetActiveNetwork = (networkConfigurationIdOrType: string) => Promise<void>;
type StartApprovalFlow = (
  options?: StartFlowOptions,
) => ApprovalFlowStartResult;
type UpsertNetworkConfiguration = (
  networkConfiguration: NetworkConfiguration,
  options?: UpsertNetworkConfigurationOptions,
) => Promise<string>;

type AddEthereumChainOptions = {
  upsertNetworkConfiguration: UpsertNetworkConfiguration;
  getCurrentRpcUrl: GetCurrentRpcUrl;
  findNetworkConfigurationBy: FindNetworkConfigurationBy;
  setActiveNetwork: SetActiveNetwork;
  requestUserApproval: RequestUserApproval;
  startApprovalFlow: StartApprovalFlow;
  endApprovalFlow: EndApprovalFlow;
  getCurrentChainIdForDomain: GetCurrentChainIdForDomain;
  getCaveat: GetCaveat;
  requestPermittedChainsPermission: RequestPermittedChainsPermission;
  getChainPermissionsFeatureFlag: GetChainPermissionsFeatureFlag;
};

type AddEthereumChainConstraint<Params extends JsonRpcParams = JsonRpcParams> =
  {
    implementation: (
      req: JsonRpcRequest<Params>,
      res: PendingJsonRpcResponse<null>,
      _next: JsonRpcEngineNextCallback,
      end: JsonRpcEngineEndCallback,
      options: AddEthereumChainOptions,
    ) => void;
  } & HandlerWrapper;

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
} satisfies AddEthereumChainConstraint;
export default addEthereumChain;

async function addEthereumChainHandler<
  Params extends JsonRpcParams = JsonRpcParams,
>(
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<null>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
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
  }: AddEthereumChainOptions,
): Promise<void> {
  let validParams;
  try {
    validParams = validateAddEthereumChainParams(req.params[0], end);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
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

  let networkClientId;
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

      networkClientId = await upsertNetworkConfiguration(
        {
          chainId,
          rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
          nickname: chainName,
          rpcUrl: firstValidRPCUrl,
          ticker,
        },
        { source: 'dapp', referrer: origin },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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
    networkClientId = existingNetwork.id ?? existingNetwork.type;
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
