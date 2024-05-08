import { ethErrors } from 'eth-rpc-errors';
import { omit } from 'lodash';
import { ApprovalType } from '@metamask/controller-utils';
import { PermissionDoesNotExistError } from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import {
  CHAIN_ID_TO_TYPE_MAP,
  NETWORK_TO_NAME_MAP,
  CHAIN_ID_TO_RPC_URL_MAP,
  CURRENCY_SYMBOLS,
  BUILT_IN_INFURA_NETWORKS,
} from '../../../../../shared/constants/network';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';

const switchEthereumChain = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: switchEthereumChainHandler,
  hookNames: {
    getCurrentChainId: true,
    findNetworkConfigurationBy: true,
    findNetworkClientIdByChainId: true,
    setNetworkClientIdForDomain: true,
    setProviderType: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getNetworkConfigurations: true,
    getProviderConfig: true,
    hasPermissions: true,
    hasPermission: true,
    getPermissionsForOrigin: true,
    getCaveat: true,
    requestSwitchNetworkPermission: true,
    getCurrentChainIdForDomain: true,
  },
};

export default switchEthereumChain;

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

async function switchEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    getCurrentChainId,
    findNetworkConfigurationBy,
    findNetworkClientIdByChainId,
    setNetworkClientIdForDomain,
    setProviderType,
    setActiveNetwork,
    requestUserApproval,
    getProviderConfig,
    hasPermissions,
    requestSwitchNetworkPermission,
    getCaveat,
    getCurrentChainIdForDomain,
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

  // setup chainId
  const { chainId } = req.params[0];

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

  // setup otherkeys
  const otherKeys = Object.keys(omit(req.params[0], ['chainId']));
  if (otherKeys.length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
      }),
    );
  }

  const currentChainIdForOrigin = getCurrentChainIdForDomain(origin);

  // get current chainId for origin
  if (currentChainIdForOrigin === _chainId) {
    res.result = null;
    return end();
  }

  const networkConfigurationForRequestedChainId = findExistingNetwork(
    _chainId,
    findNetworkConfigurationBy,
  );

  if (!networkConfigurationForRequestedChainId) {
    return end(
      ethErrors.provider.custom({
        code: 4902, // To-be-standardized "unrecognized chain ID" error
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  let permissionedChainIds;
  try {
    ({ value: permissionedChainIds } = getCaveat(
      origin,
      RestrictedMethods.wallet_switchEthereumChain,
      CaveatTypes.restrictNetworkSwitching,
    ));
  } catch (e) {
    // throws if the origin does not have any switchEthereumChain permissions yet
    if (e instanceof PermissionDoesNotExistError) {
      // suppress
    } else {
      throw e;
    }
  }

  if (
    permissionedChainIds === undefined ||
    !permissionedChainIds.includes(_chainId)
  ) {
    try {
      // TODO replace with caveat merging rather than passing already permissionedChains here as well
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
    await setActiveNetwork(networkClientId);
    if (hasPermissions(req.origin)) {
      setNetworkClientIdForDomain(req.origin, networkClientId);
    }
    res.result = null;
  } catch (error) {
    return end(error);
  }
  return end();
}
