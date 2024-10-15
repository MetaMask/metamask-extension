import { invalidParams, MethodNames } from '@metamask/permission-controller';
import { isNonEmptyArray } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';

export const revokePermissionsHandler = {
  methodNames: [MethodNames.revokePermissions],
  implementation: revokePermissionsImplementation,
  hookNames: {
    revokePermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    updateCaveat: true,
  },
};

/**
 * Revoke Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.revokePermissionsForOrigin - A hook that revokes given permission keys for an origin
 * @param options.getPermissionsForOrigin
 * @returns A promise that resolves to nothing
 */
function revokePermissionsImplementation(
  req,
  res,
  _next,
  end,
  { revokePermissionsForOrigin, getPermissionsForOrigin },
) {
  const { params, origin } = req;

  const param = params?.[0];

  if (!param) {
    return end(invalidParams({ data: { request: req } }));
  }

  // For now, this API revokes the entire permission key
  // even if caveats are specified.
  const permissionKeys = Object.keys(param).filter(
    (name) => name !== Caip25EndowmentPermissionName,
  );

  if (!isNonEmptyArray(permissionKeys)) {
    return end(invalidParams({ data: { request: req } }));
  }

  const relevantPermissionKeys = permissionKeys.filter(
    (name) =>
      ![
        RestrictedMethods.eth_accounts,
        PermissionNames.permittedChains,
      ].includes(name),
  );

  const shouldRevokeLegacyPermission =
    relevantPermissionKeys.length !== permissionKeys.length;

  if (shouldRevokeLegacyPermission) {
    const permissions = getPermissionsForOrigin(origin) || {};
    const caip25Endowment = permissions?.[Caip25EndowmentPermissionName];
    const caip25Caveat = caip25Endowment?.caveats?.find(
      ({ type }) => type === Caip25CaveatType,
    );

    if (caip25Caveat && caip25Caveat.value.isMultichainOrigin) {
      return end(
        new Error('cannot modify permission granted from multichain flow'),
      ); // TODO: better error
    }
    relevantPermissionKeys.push(Caip25EndowmentPermissionName);
  }

  revokePermissionsForOrigin(relevantPermissionKeys);

  res.result = null;

  return end();
}
