import { ethErrors } from 'eth-rpc-errors';
import { omit } from 'lodash';
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
import { PermissionNames } from '../../../controllers/permissions';
import { CaveatTypes } from '../../../../../shared/constants/permissions';

const switchEthereumChain = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: switchEthereumChainHandler,
  hookNames: {
    findNetworkConfigurationBy: true,
    setActiveNetwork: true,
    getCaveat: true,
    requestSwitchNetworkPermission: true,
    getCurrentChainIdForDomain: true,
    requestUserApproval: true,
    getChainPermissionsFeatureFlag: true,
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

function validateRequestParams(req, end) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Expected single, object parameter. Received:\n${JSON.stringify(
          req.params,
        )}`,
      }),
    );
  }

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

  const otherKeys = Object.keys(omit(req.params[0], ['chainId']));
  if (otherKeys.length > 0) {
    return end(
      ethErrors.rpc.invalidParams({
        message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
      }),
    );
  }

  return _chainId;
}
async function handleSwitchWithPermissions(
  res,
  end,
  chainid,
  networkClientIdToSwitchTo,
  { setActiveNetwork, requestSwitchNetworkPermission, getCaveat },
) {
  const { value: permissionedChainIds } =
    getCaveat({
      target: PermissionNames.permittedChains,
      caveatType: CaveatTypes.restrictNetworkSwitching,
    }) ?? {};

  if (
    permissionedChainIds === undefined ||
    !permissionedChainIds.includes(chainid)
  ) {
    try {
      await requestSwitchNetworkPermission([
        ...(permissionedChainIds ?? []),
        chainid,
      ]);
    } catch (err) {
      res.error = err;
      return end();
    }
  }

  try {
    await setActiveNetwork(networkClientIdToSwitchTo);
    res.result = null;
  } catch (error) {
    return end(error);
  }
  return end();
}

async function handleSwitchWithoutPermissions(
  res,
  end,
  networkClientIdToSwitchTo,
  origin,
  requestData,
  { setActiveNetwork, requestUserApproval },
) {
  try {
    await requestUserApproval({
      origin,
      type: ApprovalType.SwitchEthereumChain,
      requestData,
    });

    await setActiveNetwork(networkClientIdToSwitchTo);
    res.result = null;
  } catch (error) {
    return end(error);
  }
  return end();
}

async function switchEthereumChainHandler(
  req,
  res,
  _next,
  end,
  {
    findNetworkConfigurationBy,
    setActiveNetwork,
    requestSwitchNetworkPermission,
    getCaveat,
    getCurrentChainIdForDomain,
    requestUserApproval,
    getChainPermissionsFeatureFlag,
  },
) {
  const chainId = validateRequestParams(req, end);
  if (!chainId) {
    return end();
  }

  const { origin } = req;
  const currentChainIdForOrigin = getCurrentChainIdForDomain(origin);

  if (currentChainIdForOrigin === chainId) {
    res.result = null;
    return end();
  }

  const networkConfigurationForRequestedChainId = findExistingNetwork(
    chainId,
    findNetworkConfigurationBy,
  );

  const networkClientIdToSwitchTo =
    networkConfigurationForRequestedChainId?.id ??
    networkConfigurationForRequestedChainId?.type;

  if (!networkClientIdToSwitchTo) {
    return end(
      ethErrors.provider.custom({
        code: 4902,
        message: `Unrecognized chain ID "${chainId}". Try adding the chain using ${MESSAGE_TYPE.ADD_ETHEREUM_CHAIN} first.`,
      }),
    );
  }

  if (getChainPermissionsFeatureFlag()) {
    return await handleSwitchWithPermissions(
      res,
      end,
      chainId,
      networkClientIdToSwitchTo,
      {
        findNetworkConfigurationBy,
        setActiveNetwork,
        requestSwitchNetworkPermission,
        getCaveat,
      },
    );
  }

  const requestData = {
    toNetworkConfiguration: networkConfigurationForRequestedChainId,
    fromNetworkConfiguration: findExistingNetwork(
      currentChainIdForOrigin,
      findNetworkConfigurationBy,
    ),
  };

  return await handleSwitchWithoutPermissions(
    res,
    end,
    networkClientIdToSwitchTo,
    origin,
    requestData,
    {
      setActiveNetwork,
      requestUserApproval,
    },
  );
}
