import { MethodNames } from '@metamask/permission-controller';
import { parseCaipAccountId } from '@metamask/utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes } from './scope';

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
  // caveat values are frozen and must be cloned before modified
  const permissions = { ...getPermissionsForOrigin() } || {};
  const caip25endowment = permissions[Caip25EndowmentPermissionName];
  const caip25caveat = caip25endowment?.caveats.find(
    ({ type }) => type === Caip25CaveatType,
  );
  delete permissions[Caip25EndowmentPermissionName];

  if (process.env.BARAD_DUR && caip25caveat) {
    delete permissions[RestrictedMethods.eth_accounts];

    const ethAccounts = [];
    const sessionScopes = mergeScopes(
      caip25caveat.value.requiredScopes,
      caip25caveat.value.optionalScopes,
    );

    Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
      accounts?.forEach((account) => {
        const {
          address,
          chain: { namespace },
        } = parseCaipAccountId(account);

        if (namespace === 'eip155') {
          ethAccounts.push(address);
        }
      });
    });

    if (ethAccounts.length > 0) {
      permissions[RestrictedMethods.eth_accounts] = {
        ...caip25endowment,
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: Array.from(new Set(ethAccounts)),
          },
        ],
      };
    }
  }

  res.result = Object.values(permissions);
  return end();
}
