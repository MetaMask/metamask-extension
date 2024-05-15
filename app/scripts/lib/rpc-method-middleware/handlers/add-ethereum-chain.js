import { ApprovalType } from '@metamask/controller-utils';
import { errorCodes, ethErrors } from 'eth-rpc-errors';
import { omit } from 'lodash';
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

const addEthereumChain = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: addEthereumChainHandler,
  hookNames: {
    upsertNetworkConfiguration: true,
    getCurrentChainId: true,
    getCurrentRpcUrl: true,
    findNetworkConfigurationBy: true,
    setNetworkClientIdForDomain: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    startApprovalFlow: true,
    endApprovalFlow: true,
    hasPermission: true,
    getCaveat: true,
    requestSwitchNetworkPermission: true,
    findNetworkClientIdByChainId: true,
    getCurrentChainIdForDomain: true,
    getChainPermissionsFeatureFlag: true,
  },
};
export default addEthereumChain;

async function addEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    upsertNetworkConfiguration,
    getCurrentRpcUrl,
    findNetworkConfigurationBy,
    setNetworkClientIdForDomain,
    setActiveNetwork,
    requestUserApproval,
    startApprovalFlow,
    endApprovalFlow,
    getCurrentChainIdForDomain,
    hasPermission,
    getCaveat,
    requestSwitchNetworkPermission,
    findNetworkClientIdByChainId,
    getChainPermissionsFeatureFlag,
  },
) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${JSON.stringify(
          req.params,
        )}`,
      }),
    );
  }

  const { origin } = req;

  const {
    chainId,
    chainName = null,
    blockExplorerUrls = null,
    nativeCurrency = null,
    rpcUrls,
  } = req.params[0];

  const otherKeys = Object.keys(
    omit(req.params[0], [
      'chainId',
      'chainName',
      'blockExplorerUrls',
      'iconUrls',
      'rpcUrls',
      'nativeCurrency',
    ]),
  );

  if (otherKeys.length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
      }),
    );
  }

  function isLocalhostOrHttps(urlString) {
    const url = getValidUrl(urlString);

    return (
      url !== null &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.protocol === 'https:')
    );
  }

  const firstValidRPCUrl = Array.isArray(rpcUrls)
    ? rpcUrls.find((rpcUrl) => isLocalhostOrHttps(rpcUrl))
    : null;

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

  const switchChainWithPermissions = async ({
    networkConfigurationId,
    approvalFlowId,
  }) => {
    const permissionedChainIds = getCaveat({
      target: PermissionNames.permittedChains,
      caveatType: CaveatTypes.restrictNetworkSwitching,
    });

    if (
      permissionedChainIds === undefined ||
      !permissionedChainIds.includes(_chainId)
    ) {
      try {
        // TODO replace with incremental permission request
        // rather than passing already permissionedChains here
        await requestSwitchNetworkPermission([
          ...(permissionedChainIds ?? []),
          chainId,
        ]);
      } catch (err) {
        res.error = err;
        return end();
      }
    }

    const networkClientId = findNetworkClientIdByChainId(chainId);

    try {
      await setActiveNetwork(networkConfigurationId ?? networkClientId);
      // if the origin has the eth_accounts permission
      // we set per dapp network selection state
      if (hasPermission(req.origin, PermissionNames.eth_accounts)) {
        setNetworkClientIdForDomain(
          req.origin,
          networkConfigurationId ?? networkClientId,
        );
      }
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

  const currentChainIdForOrigin = getCurrentChainIdForDomain(origin);
  const currentNetworkConfiguration = findNetworkConfigurationBy({
    chainId: currentChainIdForOrigin,
  });
  const existingNetwork = findNetworkConfigurationBy({ chainId: _chainId });

  // if the request is to add a network that is already added and configured
  // with the same RPC gateway we shouldn't try to add it again.
  if (existingNetwork && existingNetwork.rpcUrl === firstValidRPCUrl) {
    // If the network already exists, the request is considered successful
    res.result = null;

    const currentRpcUrl = getCurrentRpcUrl();

    // If the current chainId and rpcUrl matches that of the incoming request
    // We don't need to proceed further.
    if (
      currentChainIdForOrigin === _chainId &&
      currentRpcUrl === firstValidRPCUrl
    ) {
      return end();
    }

    // If this network is already added but is not the currently selected network for the given origin
    // Ask the user to switch the network
    if (getChainPermissionsFeatureFlag()) {
      await switchChainWithPermissions();
    } else {
      // TODO remove once CHAIN_PERMISSIONS feature flag is gone
      try {
        await requestUserApproval({
          origin,
          type: ApprovalType.SwitchEthereumChain,
          requestData: {
            toNetworkConfiguration: existingNetwork,
            fromNetworkConfiguration: currentNetworkConfiguration,
          },
        });

        await setActiveNetwork(existingNetwork.id);
        res.result = null;
      } catch (error) {
        // For the purposes of this method, it does not matter if the user
        // declines to switch the selected network. However, other errors indicate
        // that something is wrong.
        if (error.code !== errorCodes.provider.userRejectedRequest) {
          return end(error);
        }
      }
      return end();
    }
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
  // if the chainId is the same as an existing network but the ticker is different we want to block this action
  // as it is potentially malicious and confusing
  if (
    existingNetwork &&
    existingNetwork.chainId === _chainId &&
    existingNetwork.ticker !== ticker
  ) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `nativeCurrency.symbol does not match currency symbol for a network the user already has added with the same chainId. Received:\n${ticker}`,
      }),
    );
  }
  let networkConfigurationId;

  const { id: approvalFlowId } = await startApprovalFlow();

  try {
    await requestUserApproval({
      origin,
      type: ApprovalType.AddEthereumChain,
      requestData: {
        chainId: _chainId,
        rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
        chainName: _chainName,
        rpcUrl: firstValidRPCUrl,
        ticker,
      },
    });

    networkConfigurationId = await upsertNetworkConfiguration(
      {
        chainId: _chainId,
        rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
        nickname: _chainName,
        rpcUrl: firstValidRPCUrl,
        ticker,
      },
      { source: MetaMetricsNetworkEventSource.Dapp, referrer: origin },
    );

    // Once the network has been added, the requested is considered successful
    res.result = null;
  } catch (error) {
    endApprovalFlow({ id: approvalFlowId });
    return end(error);
  }

  // Ask the user to switch the network

  if (getChainPermissionsFeatureFlag()) {
    await switchChainWithPermissions({
      networkConfigurationId,
      approvalFlowId,
    });
  } else {
    // TODO remove once CHAIN_PERMISSIONS feature flag is gone
    try {
      await requestUserApproval({
        origin,
        type: ApprovalType.SwitchEthereumChain,
        requestData: {
          toNetworkConfiguration: {
            rpcUrl: firstValidRPCUrl,
            chainId: _chainId,
            nickname: _chainName,
            ticker,
            networkConfigurationId,
          },
          fromNetworkConfiguration: currentNetworkConfiguration,
        },
      });
      if (hasPermission(req.origin, PermissionNames.eth_accounts)) {
        setNetworkClientIdForDomain(req.origin, networkConfigurationId);
      }
    } catch (error) {
      // For the purposes of this method, it does not matter if the user
      // declines to switch the selected network. However, other errors indicate
      // that something is wrong.
      return end(
        error.code === errorCodes.provider.userRejectedRequest
          ? undefined
          : error,
      );
    } finally {
      endApprovalFlow({ id: approvalFlowId });
    }

    try {
      await setActiveNetwork(networkConfigurationId);
    } catch (error) {
      return end(error);
    }
  }
  return end();
}
