import { ApprovalType } from '@metamask/controller-utils';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  type Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
  requestPermittedChainsPermissionIncremental,
} from '@metamask/chain-agnostic-permission';
import type { NetworkConfiguration } from '@metamask/network-controller';
import {
  type CaipChainId,
  type Hex,
  type Json,
  type JsonRpcResponse,
  isCaipChainId,
  isStrictHexString,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import { isSnapId } from '@metamask/snaps-utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import type {
  NetworkOrderControllerState,
  NetworkOrderController,
} from '../../../controllers/network-order';
import { getValidUrl } from '../../util';
import type {
  EndApprovalFlow,
  GetCaveat,
  GetChainPermissionsFeatureFlag,
  RejectApprovalRequestsForOrigin,
  RequestPermittedChainsPermission,
  RequestUserApproval,
  SetActiveNetwork,
} from './types';

export function validateChainId(chainId: Hex) {
  const lowercasedChainId =
    typeof chainId === 'string' ? chainId.toLowerCase() : null;
  if (
    !((value: string | null): value is Hex =>
      isPrefixedFormattedHexString(value))(lowercasedChainId)
  ) {
    throw rpcErrors.invalidParams({
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    });
  }

  if (!isSafeChainId(parseInt(chainId, 16))) {
    throw rpcErrors.invalidParams({
      message: `Invalid chain ID "${lowercasedChainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    });
  }

  return lowercasedChainId;
}

export function validateSwitchEthereumChainParams(req: {
  params: [{ chainId: Hex }];
}) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }

  const { chainId, ...otherParams } = req.params[0];

  if (Object.keys(otherParams).length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${JSON.stringify(
        Object.keys(otherParams),
      )}`,
    });
  }

  return validateChainId(chainId);
}

type AddEthereumChainParams = {
  chainId: Hex;
  chainName: string;
  blockExplorerUrls: string[] | null;
  nativeCurrency: { name?: string; symbol: string; decimals: 18 } | null;
  rpcUrls: string[];
  iconUrls?: string[];
};

export function validateAddEthereumChainParams(params: AddEthereumChainParams) {
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        params,
      )}`,
    });
  }

  const {
    chainId,
    chainName,
    blockExplorerUrls,
    nativeCurrency,
    rpcUrls,
    ...otherParams
  } = params;

  const otherKeys = Object.keys(otherParams).filter(
    // iconUrls is a valid optional but not currently used parameter
    (v) => !['iconUrls'].includes(v),
  );

  if (otherKeys.length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${JSON.stringify(
        otherKeys,
      )}`,
    });
  }

  const _chainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${JSON.stringify(
        rpcUrls,
      )}`,
    });
  }

  const isLocalhostOrHttps = (urlString: string) => {
    const url = getValidUrl(urlString);
    return (
      url !== null &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.protocol === 'https:')
    );
  };

  const firstValidRPCUrl = rpcUrls.find(
    (rpcUrl): rpcUrl is string =>
      typeof rpcUrl === 'string' && isLocalhostOrHttps(rpcUrl),
  );
  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find(
          (blockExplorerUrl): blockExplorerUrl is string =>
            typeof blockExplorerUrl === 'string' &&
            isLocalhostOrHttps(blockExplorerUrl),
        )
      : null;

  if (!firstValidRPCUrl) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${JSON.stringify(
        rpcUrls,
      )}`,
    });
  }

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    throw rpcErrors.invalidParams({
      message: `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${JSON.stringify(
        blockExplorerUrls,
      )}`,
    });
  }

  if (typeof chainName !== 'string' || !chainName) {
    throw rpcErrors.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
    });
  }

  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${JSON.stringify(
          nativeCurrency,
        )}`,
      });
    }
    if (nativeCurrency.decimals !== 18) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${JSON.stringify(
          nativeCurrency.decimals,
        )}`,
      });
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
      });
    }
  }

  const ticker = nativeCurrency?.symbol || UNKNOWN_TICKER_SYMBOL;
  if (
    ticker !== UNKNOWN_TICKER_SYMBOL &&
    (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6)
  ) {
    throw rpcErrors.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
    });
  }

  return {
    chainId: _chainId,
    chainName: _chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  };
}

type SwitchChainOptions = {
  getChainPermissionsFeatureFlag: GetChainPermissionsFeatureFlag;
  endApprovalFlow?: EndApprovalFlow;
  requestPermittedChainsPermission: RequestPermittedChainsPermission;
  origin: string;
  isAddFlow: boolean;
  isSwitchFlow: boolean;
  autoApprove: boolean;
  setActiveNetwork: SetActiveNetwork;
  getCaveat: GetCaveat<{
    value: Pick<Caip25CaveatValue, 'requiredScopes' | 'optionalScopes'>;
  }>;
  requestPermittedChainsPermissionIncrementalForOrigin: (
    options: Omit<
      Parameters<typeof requestPermittedChainsPermissionIncremental>[0],
      'hooks'
    >,
  ) => ReturnType<typeof requestPermittedChainsPermissionIncremental>;
  setTokenNetworkFilter: (chainId: Hex) => void;
  getEnabledNetworks: (
    namespace: string,
  ) => NetworkOrderControllerState['enabledNetworkMap'][keyof NetworkOrderControllerState['enabledNetworkMap']];
  setEnabledNetworks: NetworkOrderController['setEnabledNetworks'];
  rejectApprovalRequestsForOrigin: RejectApprovalRequestsForOrigin;
  requestUserApproval: RequestUserApproval;
  hasApprovalRequestsForOrigin: () => boolean;
  toNetworkConfiguration: NetworkConfiguration;
  fromNetworkConfiguration: NetworkConfiguration;
};

/**
 * Switches the active network for the origin if already permitted
 * otherwise requests approval to update permission first.
 *
 * @param response - The JSON RPC request's response object.
 * @param end - The JSON RPC request's end callback.
 * @param chainId - The chainId being switched to.
 * @param networkClientId - The network client being switched to.
 * @param hooks - The hooks object.
 * @param hooks.origin - The origin sending this request.
 * @param hooks.isAddFlow - Variable to check if its add flow.
 * @param hooks.isSwitchFlow - Variable to check if its switch flow.
 * @param [hooks.autoApprove] - A boolean indicating whether the request should prompt the user or be automatically approved.
 * @param hooks.setActiveNetwork - The callback to change the current network for the origin.
 * @param hooks.getCaveat - The callback to get the CAIP-25 caveat for the origin.
 * @param hooks.requestPermittedChainsPermissionIncrementalForOrigin - The callback to add a new chain to the permittedChains-equivalent CAIP-25 permission.
 * @param hooks.setTokenNetworkFilter - The callback to set the token network filter.
 * @param hooks.setEnabledNetworks - The callback to set the enabled networks.
 * @param hooks.getEnabledNetworks - The callback to get the current enabled networks for a namespace.
 * @param hooks.rejectApprovalRequestsForOrigin - The callback to reject all pending approval requests for the origin.
 * @param hooks.requestUserApproval - The callback to trigger user approval flow.
 * @param hooks.hasApprovalRequestsForOrigin - Function to check if there are pending approval requests from the origin.
 * @param hooks.toNetworkConfiguration - Network configuration of network switching to.
 * @param hooks.fromNetworkConfiguration - Network configuration of network switching from.
 * @returns a null response on success or an error if user rejects an approval when autoApprove is false or on unexpected errors.
 */
export async function switchChain<Result extends Json = never>(
  response: JsonRpcResponse<Result | null> & { result?: Result | null },
  end: JsonRpcEngineEndCallback,
  chainId: Hex | CaipChainId,
  networkClientId: string,
  {
    origin,
    isAddFlow,
    isSwitchFlow,
    autoApprove,
    setActiveNetwork,
    getCaveat,
    requestPermittedChainsPermissionIncrementalForOrigin,
    setTokenNetworkFilter,
    setEnabledNetworks,
    getEnabledNetworks,
    rejectApprovalRequestsForOrigin,
    requestUserApproval,
    hasApprovalRequestsForOrigin,
    toNetworkConfiguration,
    fromNetworkConfiguration,
  }: SwitchChainOptions,
) {
  try {
    if (isCaipChainId(chainId)) {
      const { namespace } = parseCaipChainId(chainId);
      const existingEnabledNetworks = getEnabledNetworks(namespace);
      const existingChainIds = Object.keys(existingEnabledNetworks);
      if (!existingChainIds.includes(chainId)) {
        setEnabledNetworks([...existingChainIds, chainId], namespace);
      }
    }

    const caip25Caveat = getCaveat({
      target: Caip25EndowmentPermissionName,
      caveatType: Caip25CaveatType,
    });

    let metadata = { options: {} };
    if (isPrefixedFormattedHexString(chainId) && isStrictHexString(chainId)) {
      if (caip25Caveat) {
        const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

        if (!ethChainIds.find((ethChainId) => ethChainId === chainId)) {
          if (isSwitchFlow) {
            metadata = {
              options: { isSwitchEthereumChain: true },
            };
          }
          await requestPermittedChainsPermissionIncrementalForOrigin({
            origin,
            chainId,
            autoApprove,
            metadata,
          });
        } else if (
          hasApprovalRequestsForOrigin?.() &&
          !isAddFlow &&
          !autoApprove
        ) {
          await requestUserApproval({
            origin,
            type: ApprovalType.SwitchEthereumChain,
            requestData: {
              toNetworkConfiguration,
              fromNetworkConfiguration,
            },
          });
        }
      } else {
        await requestPermittedChainsPermissionIncrementalForOrigin({
          origin,
          chainId,
          autoApprove,
          metadata,
        });
      }

      if (!isSnapId(origin)) {
        rejectApprovalRequestsForOrigin?.();
      }

      await setActiveNetwork(networkClientId);

      // keeping this for backward compatibility in case we need to rollback REMOVE_GNS feature flag
      // this will keep tokenNetworkFilter in sync with enabledNetworkMap while we roll this feature out
      setTokenNetworkFilter(chainId);

      const existingEnabledNetworks = getEnabledNetworks(
        KnownCaipNamespace.Eip155,
      );
      const existingChainIds = Object.keys(existingEnabledNetworks);
      if (!existingChainIds.includes(chainId)) {
        setEnabledNetworks([chainId], KnownCaipNamespace.Eip155);
      }
    } else if (isCaipChainId(chainId)) {
      const { namespace } = parseCaipChainId(chainId);
      const existingEnabledNetworks = getEnabledNetworks(namespace);
      const existingChainIds = Object.keys(existingEnabledNetworks);
      if (!existingChainIds.includes(chainId)) {
        setEnabledNetworks([chainId], namespace);
      }
    }

    response.result = null;
    return end();
  } catch (error) {
    return end(error);
  }
}
