import { ethErrors } from 'eth-rpc-errors';
import { OriginString } from '@metamask/permission-controller';
import {
  Hex,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  findExistingNetwork,
  validateSwitchEthereumChainParams,
  switchChain,
} from './ethereum-chain-utils';
import {
  FindNetworkConfigurationBy,
  GetCaveat,
  GetChainPermissionsFeatureFlag,
  HandlerWrapper,
  RequestPermittedChainsPermission,
  RequestUserApproval,
  SetActiveNetwork,
} from './types';

type GetCurrentChainIdForDomain = (origin: OriginString) => Hex;

type SwitchEthereumChainOptions = {
  findNetworkConfigurationBy: FindNetworkConfigurationBy;
  setActiveNetwork: SetActiveNetwork;
  getCaveat: GetCaveat;
  requestPermittedChainsPermission: RequestPermittedChainsPermission;
  getCurrentChainIdForDomain: GetCurrentChainIdForDomain;
  requestUserApproval: RequestUserApproval;
  getChainPermissionsFeatureFlag: GetChainPermissionsFeatureFlag;
};

type SwitchEthereumChainConstraints<
  Params extends JsonRpcParams = JsonRpcParams,
> = {
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: PendingJsonRpcResponse<null>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    {
      findNetworkConfigurationBy,
      setActiveNetwork,
      getCaveat,
      requestPermittedChainsPermission,
      getCurrentChainIdForDomain,
      requestUserApproval,
      getChainPermissionsFeatureFlag,
    }: SwitchEthereumChainOptions,
  ) => Promise<void>;
} & HandlerWrapper;

const switchEthereumChain = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: switchEthereumChainHandler,
  hookNames: {
    findNetworkConfigurationBy: true,
    setActiveNetwork: true,
    getCaveat: true,
    requestPermittedChainsPermission: true,
    getCurrentChainIdForDomain: true,
    requestUserApproval: true,
    getChainPermissionsFeatureFlag: true,
  },
} satisfies SwitchEthereumChainConstraints;

export default switchEthereumChain;

async function switchEthereumChainHandler<
  Params extends JsonRpcParams = JsonRpcParams,
>(
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<null>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    findNetworkConfigurationBy,
    setActiveNetwork,
    requestPermittedChainsPermission,
    getCaveat,
    getCurrentChainIdForDomain,
    requestUserApproval,
    getChainPermissionsFeatureFlag,
  }: SwitchEthereumChainOptions,
) {
  let chainId: Hex;
  try {
    chainId = validateSwitchEthereumChainParams(req);
  } catch (error: unknown) {
    // TODO: Remove at `@metamask/json-rpc-engine@8.0.2`: `JsonRpcEngineEndCallback` (type of `end`), is redefined from `(error?: JsonRpcEngineCallbackError) => void` to `(error?: unknown) => void`.
    // @ts-expect-error intentionally passing unhandled error of any type into `end`
    return end(error);
  }

  const { origin } = req;
  const currentChainIdForOrigin = getCurrentChainIdForDomain(origin);
  if (currentChainIdForOrigin === chainId) {
    res.result = null;
    return end();
  }

  const networkConfigurationForRequestedChainId = findExistingNetwork(
    chainId,
    findNetworkConfigurationBy,
  );

  if (!networkConfigurationForRequestedChainId) {
    return end(
      ethErrors.provider.custom({
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  const networkClientIdToSwitchTo =
    'id' in networkConfigurationForRequestedChainId &&
    networkConfigurationForRequestedChainId.id
      ? networkConfigurationForRequestedChainId?.id
      : networkConfigurationForRequestedChainId?.type;

  const requestData = {
    toNetworkConfiguration: networkConfigurationForRequestedChainId,
    fromNetworkConfiguration: findExistingNetwork(
      currentChainIdForOrigin,
      findNetworkConfigurationBy,
    ),
  };

  return switchChain(
    res,
    end,
    origin,
    chainId,
    requestData,
    networkClientIdToSwitchTo,
    null,
    {
      getChainPermissionsFeatureFlag,
      setActiveNetwork,
      requestUserApproval,
      getCaveat,
      requestPermittedChainsPermission,
    },
  );
}
