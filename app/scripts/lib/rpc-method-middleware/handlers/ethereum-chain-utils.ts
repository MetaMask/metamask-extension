import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  KnownCaipNamespace,
  parseCaipChainId,
  type Hex,
} from '@metamask/utils';
import { isSnapId } from '@metamask/snaps-utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/lib/network.utils';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import { getValidUrl } from '../../util';

type SwitchEthereumChainParams = {
  chainId: string;
};

type RequestPermittedChainsPermissionIncrementalArgs = {
  autoApprove?: boolean;
  chainId: string;
  metadata?: {
    isSwitchEthereumChain: true;
  };
};

type Caip25Caveat = {
  value: Parameters<typeof getPermittedEthChainIds>[0];
};

type RequestUserApprovalArgs = {
  origin?: string;
  requestData: Record<string, unknown>;
  type: (typeof ApprovalType)[keyof typeof ApprovalType];
};

export type SwitchChainHooks = {
  autoApprove?: boolean;
  fromNetworkConfiguration?: NetworkConfiguration;
  getCaveat: (args: {
    caveatType: typeof Caip25CaveatType;
    target: typeof Caip25EndowmentPermissionName;
  }) => Caip25Caveat | null | undefined;
  getEnabledNetworks: (namespace: string) => Record<string, boolean>;
  hasApprovalRequestsForOrigin?: () => boolean;
  isAddFlow?: boolean;
  isSwitchFlow?: boolean;
  origin?: string;
  rejectApprovalRequestsForOrigin?: () => void;
  requestPermittedChainsPermissionIncrementalForOrigin: (
    args: RequestPermittedChainsPermissionIncrementalArgs,
  ) => Promise<unknown>;
  requestUserApproval?: (args: RequestUserApprovalArgs) => Promise<unknown>;
  setActiveNetwork: (networkClientId: string) => Promise<unknown> | void;
  setEnabledNetworks: (chainId: string) => void;
  setTokenNetworkFilter: (chainId: string) => void;
  toNetworkConfiguration?: NetworkConfiguration;
};

export type ValidatedAddEthereumChainParams = {
  chainId: Hex;
  chainName: string;
  firstValidBlockExplorerUrl: string | null;
  firstValidRPCUrl: string;
  ticker: string;
};

export function validateChainId(chainId: unknown): Hex {
  const lowercasedChainId =
    typeof chainId === 'string' ? chainId.toLowerCase() : null;
  if (!isPrefixedFormattedHexString(lowercasedChainId)) {
    throw rpcErrors.invalidParams({
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${String(chainId)}`,
    });
  }

  const validatedChainId = lowercasedChainId as string;

  if (!isSafeChainId(parseInt(validatedChainId, 16))) {
    throw rpcErrors.invalidParams({
      message: `Invalid chain ID "${lowercasedChainId}": numerical value greater than max safe value. Received:\n${String(chainId)}`,
    });
  }

  // Type assertion: We validated that the chain ID is hex above.
  return validatedChainId as Hex;
}

export function validateSwitchEthereumChainParams(req: {
  params?: [SwitchEthereumChainParams] | unknown[];
}): Hex {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }

  if (!('chainId' in req.params[0])) {
    throw rpcErrors.invalidParams({
      message: `Expected single object parameter to have a "chainId". Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }

  const { chainId, ...otherParams } = req.params[0];

  if (Object.keys(otherParams).length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
        otherParams,
      ).join(',')}`,
    });
  }

  return validateChainId(chainId);
}

export function validateAddEthereumChainParams(
  params: unknown,
): ValidatedAddEthereumChainParams {
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        params,
      )}`,
    });
  }

  if (
    !(
      'chainId' in params &&
      'chainName' in params &&
      'blockExplorerUrls' in params &&
      'nativeCurrency' in params &&
      'rpcUrls' in params
    )
  ) {
    throw rpcErrors.invalidParams({
      message: `Expected single object parameter to contain "chainId", "chainName", "blockExplorerUrls", "nativeCurrency" and "rpcUrls". Received:\n${JSON.stringify(
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
    (value) => !['iconUrls'].includes(value),
  );

  if (otherKeys.length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys.join(',')}`,
    });
  }

  const validatedChainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${String(rpcUrls)}`,
    });
  }

  const isLocalhostOrHttps = (urlString: string): boolean => {
    const url = getValidUrl(urlString);
    return (
      url !== null &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.protocol === 'https:')
    );
  };

  const firstValidRPCUrl = rpcUrls.find((rpcUrl) => isLocalhostOrHttps(rpcUrl));
  const firstValidBlockExplorerUrl = Array.isArray(blockExplorerUrls)
    ? (blockExplorerUrls.find((blockExplorerUrl) =>
        isLocalhostOrHttps(blockExplorerUrl),
      ) ?? null)
    : null;

  if (!firstValidRPCUrl) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${String(rpcUrls)}`,
    });
  }

  if (typeof chainName !== 'string' || !chainName) {
    throw rpcErrors.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${String(chainName)}`,
    });
  }

  const validatedChainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${String(nativeCurrency)}`,
      });
    }
    if (
      !('decimals' in nativeCurrency) ||
      typeof nativeCurrency.decimals !== 'number' ||
      nativeCurrency.decimals !== 18
    ) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${'decimals' in nativeCurrency ? String(nativeCurrency.decimals) : 'undefined'}`,
      });
    }

    if (
      !('symbol' in nativeCurrency) ||
      typeof nativeCurrency.symbol !== 'string'
    ) {
      throw rpcErrors.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${'symbol' in nativeCurrency ? String(nativeCurrency.symbol) : 'undefined'}`,
      });
    }
  }

  const ticker = nativeCurrency?.symbol || UNKNOWN_TICKER_SYMBOL;
  if (
    ticker !== UNKNOWN_TICKER_SYMBOL &&
    (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6)
  ) {
    throw rpcErrors.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${String(ticker)}`,
    });
  }

  return {
    chainId: validatedChainId,
    chainName: validatedChainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  };
}

/**
 * Switches the active network for the origin if already permitted
 * otherwise requests approval to update permission first.
 *
 * @param response - The JSON RPC request's response object.
 * @param response.result
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
 * @param hooks.toNetworkConfiguration - Network configutation of network switching to.
 * @param hooks.fromNetworkConfiguration - Network configutation of network switching from.
 * @returns A null response on success or an error on failure.
 */
export async function switchChain(
  response: { result?: unknown },
  end: JsonRpcEngineEndCallback,
  chainId: string,
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
  }: SwitchChainHooks,
): Promise<void> {
  try {
    const caip25Caveat = getCaveat({
      target: Caip25EndowmentPermissionName,
      caveatType: Caip25CaveatType,
    });

    if (caip25Caveat) {
      const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

      if (!ethChainIds.includes(chainId as Hex)) {
        let metadata: RequestPermittedChainsPermissionIncrementalArgs['metadata'];
        if (isSwitchFlow) {
          metadata = {
            isSwitchEthereumChain: true,
          };
        }
        await requestPermittedChainsPermissionIncrementalForOrigin({
          chainId,
          autoApprove,
          metadata,
        });
      } else if (
        hasApprovalRequestsForOrigin?.() &&
        !isAddFlow &&
        !autoApprove
      ) {
        if (!requestUserApproval) {
          throw rpcErrors.internal(
            'requestUserApproval hook is required but was not provided',
          );
        }
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
        chainId,
        autoApprove,
      });
    }

    const isOriginSnap = origin ? isSnapId(origin) : false;

    if (!isOriginSnap) {
      if (!rejectApprovalRequestsForOrigin) {
        throw rpcErrors.internal(
          'rejectApprovalRequestsForOrigin hook is required but was not provided',
        );
      }
      rejectApprovalRequestsForOrigin();
    }

    await setActiveNetwork(networkClientId);

    // FIXME: `setTokenNetworkFilter` and `getEnabledNetworks` is currently breaking Snaps flow when ENS Snap
    // calls `wallet_switchEthereumChain` to auto-adjusts its network if necessary. For now we add this guard
    // but we want to come back and add remove the bandaid in favour of a more future proof solution for
    // this edge case. issue: https://github.com/MetaMask/metamask-extension/issues/35409
    if (!isOriginSnap) {
      // keeping this for backward compatibility in case we need to rollback REMOVE_GNS feature flag
      // this will keep tokenNetworkFilter in sync with enabledNetworkMap while we roll this feature out
      setTokenNetworkFilter(chainId);

      if (isPrefixedFormattedHexString(chainId)) {
        const existingEnabledNetworks = getEnabledNetworks(
          KnownCaipNamespace.Eip155,
        );
        const existingChainIds = Object.keys(existingEnabledNetworks);
        if (!existingChainIds.includes(chainId)) {
          setEnabledNetworks(chainId);
        }
      } else {
        const { namespace } = parseCaipChainId(
          chainId as `${string}:${string}`,
        );
        const existingEnabledNetworks = getEnabledNetworks(namespace);
        const existingChainIds = Object.keys(existingEnabledNetworks);
        if (!existingChainIds.includes(chainId)) {
          setEnabledNetworks(chainId);
        }
      }
    }

    response.result = null;
    return end();
  } catch (error) {
    return end(error);
  }
}

const EthChainUtils = {
  validateChainId,
  validateSwitchEthereumChainParams,
  validateAddEthereumChainParams,
  switchChain,
};

export default EthChainUtils;
