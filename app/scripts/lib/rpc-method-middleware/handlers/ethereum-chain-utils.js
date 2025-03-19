import { errorCodes, rpcErrors } from '@metamask/rpc-errors';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import { PermissionNames } from '../../../controllers/permissions';
import { getValidUrl } from '../../util';

export function validateChainId(chainId) {
  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();
  if (!isPrefixedFormattedHexString(_chainId)) {
    throw rpcErrors.invalidParams({
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    });
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    throw rpcErrors.invalidParams({
      message: `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    });
  }

  return _chainId;
}

export function validateSwitchEthereumChainParams(req, end) {
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

  return validateChainId(chainId, end);
}

export function validateAddEthereumChainParams(params, end) {
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

  const _chainId = validateChainId(chainId, end);
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

export async function switchChain(
  res,
  end,
  chainId,
  networkClientId,
  approvalFlowId,
  {
    isAddFlow,
    setActiveNetwork,
    endApprovalFlow,
    getCaveat,
    requestPermittedChainsPermission,
    grantPermittedChainsPermissionIncremental,
  },
) {
  try {
    const { value: permissionedChainIds } =
      getCaveat({
        target: PermissionNames.permittedChains,
        caveatType: CaveatTypes.restrictNetworkSwitching,
      }) ?? {};

    if (
      permissionedChainIds === undefined ||
      !permissionedChainIds.includes(chainId)
    ) {
      if (isAddFlow) {
        await grantPermittedChainsPermissionIncremental([chainId]);
      } else {
        await requestPermittedChainsPermission([chainId]);
      }
    }

    await setActiveNetwork(networkClientId);
    res.result = null;
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
      res.result = null;
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
