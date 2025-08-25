import { ApprovalType } from '@metamask/controller-utils';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import { getValidUrl } from '../../util';

export function validateChainId(chainId) {
  const lowercasedChainId =
    typeof chainId === 'string' ? chainId.toLowerCase() : null;
  if (!isPrefixedFormattedHexString(lowercasedChainId)) {
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

export function validateSwitchEthereumChainParams(req) {
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
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
        otherParams,
      )}`,
    });
  }

  return validateChainId(chainId);
}

export function validateAddEthereumChainParams(params) {
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
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
    });
  }

  const _chainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw rpcErrors.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    });
  }

  const isLocalhostOrHttps = (urlString) => {
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
      )
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

  const _chainName =
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
    chainId: _chainId,
    chainName: _chainName,
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
 * @param {string} chainId - The chainId being switched to.
 * @param {string} networkClientId - The network client being switched to.
 * @param {object} hooks - The hooks object.
 * @param {string} hooks.origin - The origin sending this request.
 * @param {boolean} hooks.isAddFlow - Variable to check if its add flow.
 * @param {boolean} hooks.isSwitchFlow - Variable to check if its switch flow.
 * @param {boolean} [hooks.autoApprove] - A boolean indicating whether the request should prompt the user or be automatically approved.
 * @param {Function} hooks.setActiveNetwork - The callback to change the current network for the origin.
 * @param {Function} hooks.getCaveat - The callback to get the CAIP-25 caveat for the origin.
 * @param {Function} hooks.requestPermittedChainsPermissionIncrementalForOrigin - The callback to add a new chain to the permittedChains-equivalent CAIP-25 permission.
 * @param {Function} hooks.setTokenNetworkFilter - The callback to set the token network filter.
 * @param {Function} hooks.setEnabledNetworks - The callback to set the enabled networks.
 * @param {Function} hooks.getEnabledNetworks - The callback to get the current enabled networks for a namespace.
 * @param {Function} hooks.rejectApprovalRequestsForOrigin - The callback to reject all pending approval requests for the origin.
 * @param {Function} hooks.requestUserApproval - The callback to trigger user approval flow.
 * @param {Function} hooks.hasApprovalRequestsForOrigin - Function to check if there are pending approval requests from the origin.
 * @param {object} hooks.toNetworkConfiguration - Network configutation of network switching to.
 * @param {object} hooks.fromNetworkConfiguration - Network configutation of network switching from.
 * @returns a null response on success or an error if user rejects an approval when autoApprove is false or on unexpected errors.
 */
export async function switchChain(
  response,
  end,
  chainId,
  networkClientId,
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
  },
) {
  try {
    const caip25Caveat = getCaveat({
      target: Caip25EndowmentPermissionName,
      caveatType: Caip25CaveatType,
    });

    if (caip25Caveat) {
      const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

      if (!ethChainIds.includes(chainId)) {
        let metadata;
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
      } else if (hasApprovalRequestsForOrigin?.() && !isAddFlow) {
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

    rejectApprovalRequestsForOrigin?.();

    await setActiveNetwork(networkClientId);

    // keeping this for backward compatibility in case we need to rollback REMOVE_GNS feature flag
    // this will keep tokenNetworkFilter in sync with enabledNetworkMap while we roll this feature out
    setTokenNetworkFilter(chainId);

    if (isPrefixedFormattedHexString(chainId)) {
      const existingEnabledNetworks = getEnabledNetworks(
        KnownCaipNamespace.Eip155,
      );
      const existingChainIds = Object.keys(existingEnabledNetworks);
      if (!existingChainIds.includes(chainId)) {
        setEnabledNetworks([chainId], KnownCaipNamespace.Eip155);
      }
    } else {
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
