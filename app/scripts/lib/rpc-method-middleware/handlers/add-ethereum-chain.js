import { ApprovalType } from '@metamask/controller-utils';
import { errorCodes, ethErrors } from 'eth-rpc-errors';
import {
  MESSAGE_TYPE,
  UNKNOWN_TICKER_SYMBOL,
} from '../../../../../shared/constants/app';
import { MetaMetricsNetworkEventSource } from '../../../../../shared/constants/metametrics';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { getValidUrl } from '../../util';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
import {
  BUILT_IN_INFURA_NETWORKS,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_ID_TO_TYPE_MAP,
  CURRENCY_SYMBOLS,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
  hookNames: {
    upsertNetworkConfiguration: true,
    getCurrentChainId: true,
    getCurrentRpcUrl: true,
    findNetworkConfigurationBy: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    startApprovalFlow: true,
    endApprovalFlow: true,
    hasPermission: true,
    getCaveat: true,
    requestSwitchNetworkPermission: true,
    getCurrentChainIdForDomain: true,
    getChainPermissionsFeatureFlag: true,
  },
};
export default addEthereumChain;

// TODO should this be searching by rpcUrl instead of chainId?
function findExistingNetwork(chainId, findNetworkConfigurationBy) {
  if (
    Object.values(BUILT_IN_INFURA_NETWORKS)
      .map(({ chainId: id }) => id)
      .includes(chainId)
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

function validateParams(params, end) {
  if (!params || typeof params !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${JSON.stringify(
          params,
        )}`,
      }),
    );
  }
  const {
    chainId,
    chainName,
    blockExplorerUrls,
    nativeCurrency,
    rpcUrls,
    ...otherParams
  } = params;

  if (Object.keys(otherParams).length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
          otherParams,
        )}`,
      }),
    );
  }

  const _chainId = typeof chainId === 'string' && chainId.toLowerCase();
  if (!isPrefixedFormattedHexString(_chainId)) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
      }),
    );
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
      }),
    );
  }

  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
      }),
    );
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
  const firstValidBlockExplorerUrl =
    blockExplorerUrls !== null && Array.isArray(blockExplorerUrls)
      ? blockExplorerUrls.find((blockExplorerUrl) =>
          isLocalhostOrHttps(blockExplorerUrl),
        )
      : null;

  if (!firstValidRPCUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
      }),
    );
  }

  if (blockExplorerUrls !== null && !firstValidBlockExplorerUrl) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected null or array with at least one valid string HTTPS URL 'blockExplorerUrl'. Received: ${blockExplorerUrls}`,
      }),
    );
  }

  if (typeof chainName !== 'string' || !chainName) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
      }),
    );
  }

  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
        }),
      );
    }
    if (nativeCurrency.decimals !== 18) {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
        }),
      );
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      return end(
        ethErrors.rpc.invalidParams({
          message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
        }),
      );
    }
  }

  const ticker = nativeCurrency?.symbol || UNKNOWN_TICKER_SYMBOL;
  if (
    ticker !== UNKNOWN_TICKER_SYMBOL &&
    (typeof ticker !== 'string' || ticker.length < 2 || ticker.length > 6)
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected 2-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
      }),
    );
  }

  return {
    chainId: _chainId,
    chainName: _chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  };
}

const switchChainWithPermissions = async (
  res,
  end,
  networkConfigurationId,
  approvalFlowId,
  chainId,
  {
    getCaveat,
    requestSwitchNetworkPermission,
    setActiveNetwork,
    endApprovalFlow,
  },
) => {
  const { value: permissionedChainIds } =
    getCaveat({
      target: PermissionNames.permittedChains,
      caveatType: CaveatTypes.restrictNetworkSwitching,
    }) ?? {};

  if (
    permissionedChainIds === undefined ||
    !permissionedChainIds.includes(chainId)
  ) {
    try {
      // TODO replace with incremental permission request
      // rather than passing already permissionedChains here
      await requestSwitchNetworkPermission([
        ...(permissionedChainIds ?? []),
        chainId,
      ]);
    } catch (err) {
      return end(err);
    }
  }

  try {
    await setActiveNetwork(networkConfigurationId);
    res.result = null;
  } catch (error) {
    return end(
      // For the purposes of this method, it does not matter if the user
      // declines to switch the selected network. However, other errors indicate
      // that something is wrong.
      error.code === errorCodes.provider.userRejectedRequest
        ? undefined
        : error,
    );
  } finally {
    if (approvalFlowId) {
      endApprovalFlow({ id: approvalFlowId });
    }
  }
  return end();
};

const switchChainWithoutPermissions = async (
  res,
  end,
  requestData,
  networkConfigurationId,
  approvalFlowId,
  origin,
  { setActiveNetwork, endApprovalFlow, requestUserApproval },
) => {
  try {
    await requestUserApproval({
      origin,
      type: ApprovalType.SwitchEthereumChain,
      requestData,
    });

    await setActiveNetwork(networkConfigurationId);
    res.result = null;
  } catch (error) {
    // For the purposes of this method, it does not matter if the user
    // declines to switch the selected network. However, other errors indicate
    // that something is wrong.
    if (error.code !== errorCodes.provider.userRejectedRequest) {
      return end(error);
    }
  } finally {
    if (approvalFlowId) {
      endApprovalFlow({ id: approvalFlowId });
    }
  }
  return end();
};

const switchChain = async (
  res,
  end,
  origin,
  chainId,
  requestData,
  networkConfigurationId,
  approvalFlowId,
  {
    getChainPermissionsFeatureFlag,
    setActiveNetwork,
    endApprovalFlow,
    requestUserApproval,
    getCaveat,
    requestSwitchNetworkPermission,
  },
) => {
  // If this network is already added but is not the currently selected network for the given origin
  // Ask the user to switch the network
  if (getChainPermissionsFeatureFlag()) {
    await switchChainWithPermissions(
      res,
      end,
      networkConfigurationId,
      approvalFlowId,
      chainId,
      {
        getCaveat,
        requestSwitchNetworkPermission,
        setActiveNetwork,
        endApprovalFlow,
      },
    );
  } else {
    // TODO remove once CHAIN_PERMISSIONS feature flag is gone
    await switchChainWithoutPermissions(
      res,
      end,
      requestData,
      networkConfigurationId,
      approvalFlowId,
      origin,
      { setActiveNetwork, endApprovalFlow, requestUserApproval },
    );
  }
  return end();
};

async function addEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    upsertNetworkConfiguration,
    getCurrentRpcUrl,
    findNetworkConfigurationBy,
    setActiveNetwork,
    requestUserApproval,
    startApprovalFlow,
    endApprovalFlow,
    getCurrentChainIdForDomain,
    getCaveat,
    requestSwitchNetworkPermission,
    getChainPermissionsFeatureFlag,
  },
) {
  const validParams = validateParams(req.params[0], end);
  if (!validParams) {
    return end();
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
  const currentNetworkConfiguration = findExistingNetwork(
    currentChainIdForDomain,
    findNetworkConfigurationBy,
  );

  // TODO should this be searching by rpcUrl instead of chainId?
  // currently we aren't preventing adding the same rpcUrl multiple times
  // since this just finds the first network with the same chainId
  // the actual add is prevented downstream in upsertNetworkConfiguration
  // but we should consider changing this to search by rpcUrl
  const existingNetwork = findExistingNetwork(
    chainId,
    findNetworkConfigurationBy,
  );

  // if the chainId is the same as an existing network but the ticker is different we want to block this action
  // as it is potentially malicious and confusing
  if (
    existingNetwork &&
    existingNetwork.chainId === chainId &&
    existingNetwork.ticker !== ticker
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
      }),
    );
  }

  let networkConfigurationId;
  let requestData;
  let approvalFlowId;

  // If the network doesn't already exist with the same rpcUrl, add it
  if (!existingNetwork || existingNetwork.rpcUrl !== firstValidRPCUrl) {
    ({ id: approvalFlowId } = await startApprovalFlow());

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

      networkConfigurationId = await upsertNetworkConfiguration(
        {
          chainId,
          rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
          nickname: chainName,
          rpcUrl: firstValidRPCUrl,
          ticker,
        },
        { source: MetaMetricsNetworkEventSource.Dapp, referrer: origin },
      );

      // Once the network has been added, the request is considered successful
      res.result = null;
    } catch (error) {
      endApprovalFlow({ id: approvalFlowId });
      return end(error);
    }

    requestData = {
      toNetworkConfiguration: {
        rpcUrl: firstValidRPCUrl,
        chainId,
        nickname: chainName,
        ticker,
        networkConfigurationId,
      },
      fromNetworkConfiguration: currentNetworkConfiguration,
    };
  } else {
    networkConfigurationId = existingNetwork.id ?? existingNetwork.type;
    const currentRpcUrl = getCurrentRpcUrl();

    // If the current chainId and rpcUrl match the incoming request, no need to proceed further
    if (
      currentChainIdForDomain === chainId &&
      currentRpcUrl === firstValidRPCUrl
    ) {
      return end();
    }

    requestData = {
      toNetworkConfiguration: existingNetwork,
      fromNetworkConfiguration: currentNetworkConfiguration,
    };

    res.result = null;
  }
  return switchChain(
    res,
    end,
    origin,
    chainId,
    requestData,
    networkConfigurationId,
    approvalFlowId,
    {
      getChainPermissionsFeatureFlag,
      setActiveNetwork,
      endApprovalFlow,
      requestUserApproval,
      getCaveat,
      requestSwitchNetworkPermission,
    },
  );
}
