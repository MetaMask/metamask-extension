import { errorCodes, ethErrors } from 'eth-rpc-errors';
import { ApprovalType } from '@metamask/controller-utils';
import {
  Hex,
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  JsonRpcResponse,
  isJsonRpcError,
} from '@metamask/utils';
import { JsonRpcEngineEndCallback } from 'json-rpc-engine';
import { OriginString } from '@metamask/permission-controller';

import {
  BUILT_IN_INFURA_NETWORKS,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_ID_TO_TYPE_MAP,
  CURRENCY_SYMBOLS,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import { PermissionNames } from '../../../controllers/permissions';
import { getValidUrl } from '../../util';
import {
  EndApprovalFlow,
  FindNetworkConfigurationBy,
  GetCaveat,
  GetChainPermissionsFeatureFlag,
  RequestPermittedChainsPermission,
  RequestUserApproval,
  SetActiveNetwork,
} from './types';

export function findExistingNetwork(
  chainId: Hex,
  findNetworkConfigurationBy: FindNetworkConfigurationBy,
) {
  if (
    ((inputId: Hex): inputId is keyof typeof CHAIN_ID_TO_TYPE_MAP =>
      Object.values(BUILT_IN_INFURA_NETWORKS)
        .map(({ chainId: id }) => id)
        .find((id) => id === inputId) !== undefined)(chainId)
  ) {
    return {
      chainId,
      ticker: CURRENCY_SYMBOLS.ETH,
      nickname: NETWORK_TO_NAME_MAP[chainId],
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[chainId],
      type: CHAIN_ID_TO_TYPE_MAP[chainId],
    };
  }
  return findNetworkConfigurationBy({ chainId });
}

export function validateChainId(chainId: Hex): Hex {
  const _chainId = chainId.toLowerCase();

  if (
    !((value: string): value is Hex => isPrefixedFormattedHexString(value))(
      _chainId,
    )
  ) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    });
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    throw ethErrors.rpc.invalidParams({
      message: `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    });
  }

  return _chainId;
}

export function validateSwitchEthereumChainParams<
  Params extends JsonRpcParams = { chainId: Hex } & JsonRpcParams,
>(req: JsonRpcRequest<Params>) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    throw ethErrors.rpc.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId, ...otherParams } = req.params[0];

  if (Object.keys(otherParams).length > 0) {
    throw ethErrors.rpc.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
        otherParams,
      )}`,
    });
  }

  return validateChainId(chainId);
}

export function validateAddEthereumChainParams(
  params: {
    chainId: Hex;
  } & Record<string, Json>,
) {
  if (!params || typeof params !== 'object') {
    throw ethErrors.rpc.invalidParams({
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
    throw ethErrors.rpc.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
    });
  }

  const _chainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
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
    throw ethErrors.rpc.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    });
  }

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
    });
  }

  if (typeof chainName !== 'string' || !chainName) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
    });
  }

  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw ethErrors.rpc.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    if (nativeCurrency.decimals !== 18) {
      throw ethErrors.rpc.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
      });
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      throw ethErrors.rpc.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
      });
    }
  }

  const ticker = nativeCurrency?.symbol || UNKNOWN_TICKER_SYMBOL;
  if (
    ticker !== UNKNOWN_TICKER_SYMBOL &&
    (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6)
  ) {
    throw ethErrors.rpc.invalidParams({
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

export async function switchChain<Result extends Json = never>(
  res: JsonRpcResponse<Result | null>,
  end: JsonRpcEngineEndCallback,
  origin: OriginString,
  chainId: Hex,
  requestData: Record<string, Json>,
  networkClientId: string,
  approvalFlowId: string,
  {
    getChainPermissionsFeatureFlag,
    setActiveNetwork,
    endApprovalFlow,
    requestUserApproval,
    getCaveat,
    requestPermittedChainsPermission,
  }: {
    getChainPermissionsFeatureFlag: GetChainPermissionsFeatureFlag;
    setActiveNetwork: SetActiveNetwork;
    endApprovalFlow: EndApprovalFlow;
    requestUserApproval: RequestUserApproval;
    getCaveat: GetCaveat;
    requestPermittedChainsPermission: RequestPermittedChainsPermission;
  },
) {
  try {
    if (getChainPermissionsFeatureFlag()) {
      const { value: permissionedChainIds } =
        getCaveat({
          target: PermissionNames.permittedChains,
          caveatType: CaveatTypes.restrictNetworkSwitching,
        }) ?? {};

      if (!permissionedChainIds?.includes(chainId)) {
        await requestPermittedChainsPermission([chainId]);
      }
    } else {
      await requestUserApproval({
        origin,
        type: ApprovalType.SwitchEthereumChain,
        requestData,
      });
    }

    await setActiveNetwork(networkClientId);
    res.result = null;
  } catch (error: unknown) {
    // We don't want to return an error if user rejects the request
    // and this is a chained switch request after wallet_addEthereumChain.
    // approvalFlowId is only defined when this call is of a
    // wallet_addEthereumChain request so we can use it to determine
    // if we should return an error
    if (
      isJsonRpcError(error) &&
      error.code === errorCodes.provider.userRejectedRequest &&
      approvalFlowId
    ) {
      res.result = null;
      return end();
    }
    // TODO: Remove at `@metamask/json-rpc-engine@8.0.2`: `JsonRpcEngineEndCallback` (type of `end`), is redefined from `(error?: JsonRpcEngineCallbackError) => void` to `(error?: unknown) => void`.
    // @ts-expect-error intentionally passing unhandled error of any type into `end`
    return end(error);
  } finally {
    if (approvalFlowId) {
      endApprovalFlow({ id: approvalFlowId });
    }
  }
  return end();
}
