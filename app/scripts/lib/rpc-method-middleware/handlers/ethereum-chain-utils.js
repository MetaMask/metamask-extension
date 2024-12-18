import { errorCodes, rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/multichain';
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
 * @param {string} [approvalFlowId] - The optional approval flow ID to handle.
 * @param {object} hooks - The hooks object.
 * @param {boolean} hooks.isAddFlow - The boolean determining if this call originates from wallet_addEthereumChain.
 * @param {Function} hooks.setActiveNetwork - The callback to change the current network for the origin.
 * @param {Function} hooks.endApprovalFlow - The optional callback to end the approval flow when approvalFlowId is provided.
 * @param {Function} hooks.getCaveat - The callback to get the CAIP-25 caveat for the origin.
 * @param {Function} hooks.requestPermittedChainsPermissionForOrigin - The callback to request a new permittedChains-equivalent CAIP-25 permission.
 * @param {Function} hooks.requestPermittedChainsPermissionIncrementalForOrigin - The callback to add a new chain to the permittedChains-equivalent CAIP-25 permission.
 * @returns a null response on success or an error if user rejects an approval when isAddFlow is false or on unexpected errors.
 */
export async function switchChain(
  response,
  end,
  chainId,
  networkClientId,
  approvalFlowId,
  {
    isAddFlow,
    setActiveNetwork,
    endApprovalFlow,
    getCaveat,
    requestPermittedChainsPermissionForOrigin,
    requestPermittedChainsPermissionIncrementalForOrigin,
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
        await requestPermittedChainsPermissionIncrementalForOrigin({
          chainId,
          autoApprove: isAddFlow,
        });
      }
    } else {
      await requestPermittedChainsPermissionForOrigin({
        chainId,
        autoApprove: isAddFlow,
      });
    }

    await setActiveNetwork(networkClientId);
    response.result = null;
  } catch (error) {
    // We don't want to return an error if user rejects the request
    // and this is a chained switch request after wallet_addEthereumChain.
    // approvalFlowId is only defined when this call is of a
    // wallet_addEthereumChain request so we can use it to determine
    // if we should return an error
    if (
      error.code === errorCodes.provider.userRejectedRequest &&
      approvalFlowId
    ) {
      response.result = null;
      return end();
    }
    return end(error);
  } finally {
    if (approvalFlowId) {
      endApprovalFlow({ id: approvalFlowId });
    }
  }
  return end();
}
