import {
  CaveatSpecificationConstraint,
  invalidParams,
  MethodNames,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import {
  isNonEmptyArray,
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain';
import {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from 'json-rpc-engine';
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
  req: JsonRpcRequest<Json[]>,
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    revokePermissionsForOrigin,
    getPermissionsForOrigin,
  }: {
    revokePermissionsForOrigin: (permissionKeys: string[]) => void;
    getPermissionsForOrigin: () => ReturnType<
      PermissionController<
        PermissionSpecificationConstraint,
        CaveatSpecificationConstraint
      >['getPermissions']
    >;
  },
) {
  const { params } = req;

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
    (name: string) =>
      ![
        RestrictedMethods.eth_accounts as string,
        PermissionNames.permittedChains as string,
      ].includes(name),
  );

  const shouldRevokeLegacyPermission =
    relevantPermissionKeys.length !== permissionKeys.length;

  if (shouldRevokeLegacyPermission) {
    const permissions = getPermissionsForOrigin() || {};
    const caip25Endowment = permissions?.[Caip25EndowmentPermissionName];
    const caip25CaveatValue = caip25Endowment?.caveats?.find(
      ({ type }) => type === Caip25CaveatType,
    )?.value as Caip25CaveatValue;

    if (caip25CaveatValue?.isMultichainOrigin) {
      return end(
        new Error('Cannot modify permission granted via the Multichain API. Either modify the permission using the Multichain API or revoke permissions and request again.'),
      ); // TODO: better error
    }
    relevantPermissionKeys.push(Caip25EndowmentPermissionName);
  }

  revokePermissionsForOrigin(relevantPermissionKeys);

  res.result = null;

  return end();
}
