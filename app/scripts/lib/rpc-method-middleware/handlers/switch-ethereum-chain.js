import { ethErrors } from 'eth-rpc-errors';
import { omit } from 'lodash';
import { PermissionDoesNotExistError } from '@metamask/permission-controller';
import { ApprovalType } from '@metamask/controller-utils';
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
    findNetworkConfigurationBy: true,
    findNetworkClientIdByChainId: true,
    setNetworkClientIdForDomain: true,
    setProviderType: true,
    setActiveNetwork: true,
    getNetworkConfigurations: true,
    hasPermissions: true,
    hasPermission: true,
    getPermissionsForOrigin: true,
    getCaveat: true,
    requestSwitchNetworkPermission: true,
    getCurrentChainIdForDomain: true,
    // old hooks no longer used post chain permissioning:
    getProviderConfig: true,
    getCurrentChainId: true,
    requestUserApproval: true,
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
    findNetworkConfigurationBy,
    findNetworkClientIdByChainId,
    setNetworkClientIdForDomain,
    setActiveNetwork,
    hasPermissions,
    requestSwitchNetworkPermission,
    getCaveat,
    getCurrentChainIdForDomain,
    getProviderConfig,
    requestUserApproval,
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

  if (process.env?.CHAIN_PERMISSIONS) {
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
        // suppress expected error in case that the domain does not have a
        // wallet_switchEthereumChain permission set yet
      } else {
        throw e;
      }
    }

    if (
      permissionedChainIds === undefined ||
      !permissionedChainIds.includes(_chainId)
    ) {
      try {
        // TODO replace with caveat merging once merged
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
  // preserving old behavior when not using the chain permissionsing logic

  const requestData = {
    toNetworkConfiguration: findExistingNetwork(
      _chainId,
      findNetworkConfigurationBy,
    ),
  };

  requestData.fromNetworkConfiguration = getProviderConfig();

  if (requestData.toNetworkConfiguration) {
    // we might want to change all this so that it displays the network you are switching from -> to (in a way that is domain - specific)
    const networkClientId = findNetworkClientIdByChainId(_chainId);

    try {
      const approvedRequestData = await requestUserApproval({
        origin,
        type: ApprovalType.SwitchEthereumChain,
        requestData,
      });

      await setActiveNetwork(approvedRequestData.id);

      if (hasPermissions(req.origin)) {
        setNetworkClientIdForDomain(req.origin, networkClientId);
      }
      res.result = null;
    } catch (error) {
      return end(error);
    }
    return end();
  }

  return end(
    ethErrors.provider.custom({
      code: 4902, // To-be-standardized "unrecognized chain ID" error
      message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
    }),
  );
}
