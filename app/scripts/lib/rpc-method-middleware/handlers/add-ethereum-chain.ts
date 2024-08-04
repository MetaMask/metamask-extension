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
  Json,
} from '@metamask/utils';
import { ApprovalType } from '@metamask/controller-utils';
import {
  ApprovalFlowStartResult,
  StartFlowOptions,
} from '@metamask/approval-controller';
import { Domain } from '@metamask/selected-network-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  findExistingNetwork,
  switchChain,
  validateAddEthereumChainParams,
} from './ethereum-chain-utils';
import {
  HandlerWrapper,
  EndApprovalFlow,
  FindNetworkConfigurationBy,
  GetCaveat,
  GetChainPermissionsFeatureFlag,
  RequestPermittedChainsPermission,
  RequestUserApproval,
  SetActiveNetwork,
} from './types';

export type UpsertNetworkConfigurationOptions = {
  referrer: string;
  source: string;
  setActive?: boolean;
};

type GetCurrentChainIdForDomain = (domain: Domain) => Hex;
type GetCurrentRpcUrl = () => string | undefined;
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

type AddEthereumChainConstraint<
  Params extends JsonRpcParams = JsonRpcParams,
  Result extends Json = never,
> = {
  implementation: (
    req: JsonRpcRequest<Params>,
    res: PendingJsonRpcResponse<Result | null>,
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
  Result extends Json = never,
>(
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<Result | null>,
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
    validParams = ((params) => validateAddEthereumChainParams(params))(
      req.params[0],
    ) as Omit<
      ReturnType<typeof validateAddEthereumChainParams>,
      'firstValidBlockExplorerUrl' | 'firstValidRPCUrl'
    > &
      Record<'firstValidBlockExplorerUrl' | 'firstValidRPCUrl', string>;
  } catch (error: unknown) {
    // TODO: Remove at `@metamask/json-rpc-engine@8.0.2`: `JsonRpcEngineEndCallback` (type of `end`), is redefined from `(error?: JsonRpcEngineCallbackError) => void` to `(error?: unknown) => void`.
    // @ts-expect-error intentionally passing unhandled error of any type into `end`
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
  const approvalFlowId = startApprovalFlow().id;

  if (!existingNetwork || existingNetwork.rpcUrl !== firstValidRPCUrl) {
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
    } catch (error: unknown) {
      endApprovalFlow({ id: approvalFlowId });
      // TODO: Remove at `@metamask/json-rpc-engine@8.0.2`: `JsonRpcEngineEndCallback` (type of `end`), is redefined from `(error?: JsonRpcEngineCallbackError) => void` to `(error?: unknown) => void`.
      // @ts-expect-error intentionally passing unhandled error of any type into `end`
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
    networkClientId =
      'id' in existingNetwork && existingNetwork.id
        ? existingNetwork.id
        : existingNetwork.type;
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
