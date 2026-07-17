import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type {
  AddNetworkFields,
  NetworkConfiguration,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import * as URI from 'uri-js';
import { ApprovalType } from '@metamask/controller-utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import { cloneDeep } from 'lodash';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { FEATURED_RPCS } from '../../../../../shared/constants/network';
import {
  validateAddEthereumChainParams,
  switchChain,
  type SwitchChainHooks,
} from './ethereum-chain-utils';

type AddEthereumChainParams = [
  {
    blockExplorerUrls?: string[];
    chainId: string;
    chainName: string;
    nativeCurrency: {
      decimals: number;
      symbol: string;
    } | null;
    rpcUrls: string[];
  },
];

export type AddEthereumChainRequest = {
  origin: string;
  params?: AddEthereumChainParams;
};

type ReplaceSelectedRpcEndpointOptions = {
  replacementSelectedRpcEndpointIndex?: number;
};

export type AddEthereumChainHooks = Pick<
  SwitchChainHooks,
  | 'getCaveat'
  | 'getEnabledNetworks'
  | 'rejectApprovalRequestsForOrigin'
  | 'requestPermittedChainsPermissionIncrementalForOrigin'
  | 'setActiveNetwork'
  | 'setEnabledNetworks'
  | 'setTokenNetworkFilter'
> & {
  addNetwork: (network: AddNetworkFields) => Promise<NetworkConfiguration>;
  getCurrentChainIdForDomain: (origin: string) => string;
  getNetworkConfigurationByChainId: (
    chainId: string,
  ) => NetworkConfiguration | undefined;
  requestUserApproval: (args: {
    origin: string;
    requestData: {
      chainId: string;
      chainName: string;
      rpcPrefs: {
        blockExplorerUrl: string | null;
      };
      rpcUrl: string;
      ticker: string;
    };
    type: typeof ApprovalType.AddEthereumChain;
  }) => Promise<unknown>;
  updateNetwork: (
    chainId: string,
    network: UpdateNetworkFields,
    options?: ReplaceSelectedRpcEndpointOptions,
  ) => Promise<NetworkConfiguration>;
};

type AddEthereumChainConstraint = MethodHandler<
  AddEthereumChainHooks,
  never,
  AddEthereumChainParams,
  null,
  { origin: string }
>;

export const addEthereumChainHandler = {
  implementation: addEthereumChainImplementation,
  hookNames: {
    addNetwork: true,
    updateNetwork: true,
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCurrentChainIdForDomain: true,
    getCaveat: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
    setTokenNetworkFilter: true,
    setEnabledNetworks: true,
    getEnabledNetworks: true,
  },
} satisfies AddEthereumChainConstraint;

const addEthereumChainHandlers = {
  [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN]: addEthereumChainHandler,
};

export default addEthereumChainHandlers;

async function addEthereumChainImplementation(
  req: AddEthereumChainRequest,
  res: PendingJsonRpcResponse<null>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    addNetwork,
    updateNetwork,
    getNetworkConfigurationByChainId,
    setActiveNetwork,
    requestUserApproval,
    getCurrentChainIdForDomain,
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    getEnabledNetworks,
  }: AddEthereumChainHooks,
): Promise<void> {
  let validParams;
  try {
    validParams = validateAddEthereumChainParams(req.params?.[0]);
  } catch (error) {
    return end(error as Parameters<JsonRpcEngineEndCallback>[0]);
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
  const existingNetwork = getNetworkConfigurationByChainId(chainId);

  if (
    existingNetwork &&
    existingNetwork.chainId === chainId &&
    existingNetwork.nativeCurrency !== ticker
  ) {
    return end(
      rpcErrors.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
      }),
    );
  }

  let updatedNetwork = existingNetwork;

  let rpcIndex = existingNetwork?.rpcEndpoints.findIndex(({ url }) =>
    URI.equal(url, firstValidRPCUrl),
  );

  let blockExplorerIndex = firstValidBlockExplorerUrl
    ? existingNetwork?.blockExplorerUrls.findIndex((url) =>
        URI.equal(url, firstValidBlockExplorerUrl),
      )
    : undefined;

  const shouldAddOrUpdateNetwork =
    !existingNetwork ||
    rpcIndex !== existingNetwork.defaultRpcEndpointIndex ||
    Boolean(
      firstValidBlockExplorerUrl &&
      blockExplorerIndex !== existingNetwork.defaultBlockExplorerUrlIndex,
    );

  if (shouldAddOrUpdateNetwork) {
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
        const clonedNetwork = cloneDeep(existingNetwork) as UpdateNetworkFields;

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

        if (firstValidBlockExplorerUrl) {
          if (blockExplorerIndex === -1) {
            clonedNetwork.blockExplorerUrls = [
              ...clonedNetwork.blockExplorerUrls,
              firstValidBlockExplorerUrl,
            ];
            blockExplorerIndex = clonedNetwork.blockExplorerUrls.length - 1;
          }

          clonedNetwork.defaultBlockExplorerUrlIndex = blockExplorerIndex;
        }

        updatedNetwork = await updateNetwork(
          clonedNetwork.chainId,
          clonedNetwork,
          currentChainIdForDomain === chainId
            ? {
                replacementSelectedRpcEndpointIndex:
                  clonedNetwork.defaultRpcEndpointIndex,
              }
            : undefined,
        );
      } else {
        const featured = FEATURED_RPCS.find(
          (network: (typeof FEATURED_RPCS)[number]) =>
            network.chainId === chainId,
        );
        const featuredEndpoint = featured
          ? featured.rpcEndpoints[featured.defaultRpcEndpointIndex]
          : undefined;

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
            ...(featuredEndpoint &&
            !URI.equal(firstValidRPCUrl, featuredEndpoint.url)
              ? [featuredEndpoint]
              : []),
            {
              url: firstValidRPCUrl,
              name: chainName,
              type: RpcEndpointType.Custom,
            },
          ],
        });
      }
    } catch (error) {
      return end(error as Parameters<JsonRpcEngineEndCallback>[0]);
    }
  }

  const existingNetworkClientId =
    existingNetwork?.rpcEndpoints?.[existingNetwork.defaultRpcEndpointIndex]
      ?.networkClientId;

  const updatedNetworkClientId =
    updatedNetwork?.rpcEndpoints?.[updatedNetwork.defaultRpcEndpointIndex]
      ?.networkClientId;

  const networkClientId = existingNetworkClientId ?? updatedNetworkClientId;

  if (!networkClientId) {
    return end(
      rpcErrors.internal({
        message: `Unable to determine network client ID for chain "${chainId}".`,
      }),
    );
  }

  return switchChain(res, end, chainId, networkClientId, {
    origin,
    isAddFlow: true,
    autoApprove: shouldAddOrUpdateNetwork,
    setActiveNetwork,
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    rejectApprovalRequestsForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    getEnabledNetworks,
  });
}
