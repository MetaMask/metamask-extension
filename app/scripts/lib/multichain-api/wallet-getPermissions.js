import { MethodNames } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../controllers/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { getEthAccounts } from './adapters/caip-permission-adapter-eth-accounts';
import { getPermittedEthChainIds } from './adapters/caip-permission-adapter-permittedChains';

export const getPermissionsHandler = {
  methodNames: [MethodNames.getPermissions],
  implementation: getPermissionsImplementation,
  hookNames: {
    getPermissionsForOrigin: true,
  },
};

/**
 * Get Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param _req - The JsonRpcEngine request - unused
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getPermissionsForOrigin - The specific method hook needed for this method implementation
 * @returns A promise that resolves to nothing
 */
function getPermissionsImplementation(
  _req,
  res,
  _next,
  end,
  { getPermissionsForOrigin },
) {
  // permissions are frozen and must be cloned before modified
  const permissions = { ...getPermissionsForOrigin() } || {};
  const caip25Endowment = permissions[Caip25EndowmentPermissionName];
  const caip25Caveat = caip25Endowment?.caveats.find(
    ({ type }) => type === Caip25CaveatType,
  );
  delete permissions[Caip25EndowmentPermissionName];

  if (caip25Caveat) {
    const ethAccounts = getEthAccounts(caip25Caveat.value);

    if (ethAccounts.length > 0) {
      permissions[RestrictedMethods.eth_accounts] = {
        ...caip25Endowment,
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ethAccounts,
          },
        ],
      };
    }

    const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

    if (ethChainIds.length > 0) {
      permissions[PermissionNames.permittedChains] = {
        ...caip25Endowment,
        parentCapability: PermissionNames.permittedChains,
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ethChainIds,
          },
        ],
      };
    }
  }

  res.result = Object.values(permissions);
  return end();
}
