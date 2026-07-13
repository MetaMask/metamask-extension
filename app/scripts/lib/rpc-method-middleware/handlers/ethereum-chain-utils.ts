import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import type { NetworkConfiguration } from '@metamask/network-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { KnownCaipNamespace, parseCaipChainId, type Hex } from '@metamask/utils';
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

type AddEthereumChainNativeCurrency = {
  decimals: number;
  symbol: string;
};

type AddEthereumChainParameter = {
  blockExplorerUrls?: string[];
  chainId: string;
  chainName: string;
  iconUrls?: string[];
  nativeCurrency: AddEthereumChainNativeCurrency | null;
  rpcUrls: string[];
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
  getEnabledNetworks: (namespace: string) => Record<string, unknown>;
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
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    });
  }

  const validatedChainId = lowercasedChainId as string;

  if (!isSafeChainId(parseInt(validatedChainId, 16))) {
    throw rpcErrors.invalidParams({
      message: `Invalid chain ID "${lowercasedChainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    });
  }

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

  const { chainId, ...otherParams } = req.params[0] as SwitchEthereumChainParams &
    Record<string, unknown>;

  if (Object.keys(otherParams).length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
        otherParams,
      )}`,
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

  const {
    chainId,
    chainName,
    blockExplorerUrls,
    nativeCurrency,
    rpcUrls,
    ...otherParams
  } = params as AddEthereumChainParameter & Record<string, unknown>;

  const otherKeys = Object.keys(otherParams).filter(
    (value) => !['iconUrls'].includes(value),
  );

  if (otherKeys.length > 0) {
    throw rpcErrors.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
    });
  }

  const validatedChainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
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
    ? blockExplorerUrls.find((blockExplorerUrl) =>
        isLocalhostOrHttps(blockExplorerUrl),
      ) ?? null
    : null;

  if (!firstValidRPCUrl) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    });
  }

  if (typeof chainName !== 'string' || !chainName) {
    throw rpcErrors.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
    });
  }

  const validatedChainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw rpcErrors.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    if (nativeCurrency.decimals !== 18) {
      throw rpcErrors.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
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
 * @param end - The JSON RPC request's end callback.
 * @param chainId - The chainId being switched to.
 * @param networkClientId - The network client being switched to.
 * @param hooks - The hooks object.
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
        await requestUserApproval?.({
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
      rejectApprovalRequestsForOrigin?.();
    }

    await setActiveNetwork(networkClientId);

    if (!isOriginSnap) {
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
    return end(error as Parameters<JsonRpcEngineEndCallback>[0]);
  }
}

const EthChainUtils = {
  validateChainId,
  validateSwitchEthereumChainParams,
  validateAddEthereumChainParams,
  switchChain,
};

export default EthChainUtils;
