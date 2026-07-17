import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import { providerErrors } from '@metamask/rpc-errors';
import { isSnapId } from '@metamask/snaps-utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  switchChain,
  validateSwitchEthereumChainParams,
  type SwitchChainHooks,
} from './ethereum-chain-utils';

type SwitchEthereumChainParams = [
  {
    chainId: string;
  },
];

export type SwitchEthereumChainRequest = {
  origin: string;
  params?: SwitchEthereumChainParams;
};

export type SwitchEthereumChainHooks = Pick<
  SwitchChainHooks,
  | 'getCaveat'
  | 'getEnabledNetworks'
  | 'hasApprovalRequestsForOrigin'
  | 'rejectApprovalRequestsForOrigin'
  | 'requestPermittedChainsPermissionIncrementalForOrigin'
  | 'requestUserApproval'
  | 'setActiveNetwork'
  | 'setEnabledNetworks'
  | 'setTokenNetworkFilter'
> & {
  getCurrentChainIdForDomain: (origin: string) => string;
  getNetworkConfigurationByChainId: (
    chainId: string,
  ) => NetworkConfiguration | undefined;
};

type SwitchEthereumChainConstraint = MethodHandler<
  SwitchEthereumChainHooks,
  never,
  SwitchEthereumChainParams,
  null,
  { origin: string }
>;

export const switchEthereumChainHandler = {
  implementation: switchEthereumChainImplementation,
  hookNames: {
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCaveat: true,
    getCurrentChainIdForDomain: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
    setTokenNetworkFilter: true,
    setEnabledNetworks: true,
    getEnabledNetworks: true,
    hasApprovalRequestsForOrigin: true,
  },
} satisfies SwitchEthereumChainConstraint;

const switchEthereumChainHandlers = {
  [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN]: switchEthereumChainHandler,
};

export default switchEthereumChainHandlers;

async function switchEthereumChainImplementation(
  req: SwitchEthereumChainRequest,
  res: PendingJsonRpcResponse<null>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getNetworkConfigurationByChainId,
    setActiveNetwork,
    requestUserApproval,
    getCaveat,
    getCurrentChainIdForDomain,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    getEnabledNetworks,
    hasApprovalRequestsForOrigin,
  }: SwitchEthereumChainHooks,
): Promise<void> {
  let chainId;
  try {
    chainId = validateSwitchEthereumChainParams(req);
  } catch (error) {
    return end(error as Parameters<JsonRpcEngineEndCallback>[0]);
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
    ]?.networkClientId;

  if (!networkClientIdToSwitchTo) {
    return end(
      providerErrors.custom({
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  const fromNetworkConfiguration = getNetworkConfigurationByChainId(
    currentChainIdForOrigin,
  );

  const toNetworkConfiguration = getNetworkConfigurationByChainId(chainId);

  return switchChain(res, end, chainId, networkClientIdToSwitchTo, {
    origin,
    isSwitchFlow: true,
    autoApprove: isSnapId(origin),
    setActiveNetwork,
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    getEnabledNetworks,
    requestUserApproval,
    hasApprovalRequestsForOrigin,
    toNetworkConfiguration,
    fromNetworkConfiguration,
  });
}
