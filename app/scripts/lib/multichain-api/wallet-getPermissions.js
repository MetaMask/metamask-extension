import { MethodNames } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/multichain';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../controllers/permissions';

export const getPermissionsHandler = {
  methodNames: [MethodNames.getPermissions],
  implementation: getPermissionsImplementation,
  hookNames: {
    getPermissionsForOrigin: true,
    getAccounts: true,
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
 * @param options.getAccounts
 * @returns A promise that resolves to nothing
 */
async function getPermissionsImplementation(
  _req,
  res,
  _next,
  end,
  { getPermissionsForOrigin, getAccounts },
) {
  // permissions are frozen and must be cloned before modified
  const permissions = { ...getPermissionsForOrigin() } || {};
  const caip25Endowment = permissions[Caip25EndowmentPermissionName];
  const caip25Caveat = caip25Endowment?.caveats?.find(
    ({ type }) => type === Caip25CaveatType,
  );
  delete permissions[Caip25EndowmentPermissionName];

  if (caip25Caveat) {
    // We cannot derive ethAccounts directly from the CAIP-25 permission
    // because the accounts will not be in order of lastSelected
    const ethAccounts = await getAccounts();

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
