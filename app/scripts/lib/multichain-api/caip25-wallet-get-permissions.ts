import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import {
  MethodNames,
  PermissionConstraint,
  PermittedHandlerExport,
  SubjectPermissions,
} from '@metamask/permission-controller';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import { parseAccountId } from '@metamask/snaps-utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes } from './scope';

export const caip25getPermissionsHandler: PermittedHandlerExport<
  GetPermissionsHooks,
  [],
  PermissionConstraint[]
> = {
  methodNames: [MethodNames.getPermissions],
  implementation: caip25getPermissionsImplementation,
  hookNames: {
    getPermissionsForOrigin: true,
  },
};

export type GetPermissionsHooks = {
  // This must be bound to the requesting origin.
  getPermissionsForOrigin: () => SubjectPermissions<PermissionConstraint>;
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
async function caip25getPermissionsImplementation(
  _req: unknown,
  res: PendingJsonRpcResponse<PermissionConstraint[]>,
  _next: unknown,
  end: JsonRpcEngineEndCallback,
  { getPermissionsForOrigin }: GetPermissionsHooks,
): Promise<void> {
  const permissions = getPermissionsForOrigin() || {};
  const caip25permission = permissions[Caip25EndowmentPermissionName];
  const caip25authorization = caip25permission.caveats?.find(
    ({ type }) => type === Caip25CaveatType,
  )?.value as Caip25CaveatValue;
  if (!caip25permission || !caip25authorization) {
    res.result = [];
    return end();
  }

  const ethAccounts: string[] = [];
  const sessionScopes = mergeScopes(
    caip25authorization.requiredScopes,
    caip25authorization.optionalScopes,
  );

  Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
    accounts?.forEach((account) => {
      const {
        address,
        chain: { namespace },
      } = parseAccountId(account);

      if (namespace === 'eip155') {
        ethAccounts.push(address);
      }
    });
  });

  const transformedPermissions = {
    ...permissions,
    [RestrictedMethods.eth_accounts]: {
      ...caip25permission,
      parentCapability: RestrictedMethods.eth_accounts,
      caveats: [
        {
          type: CaveatTypes.restrictReturnedAccounts,
          value: Array.from(new Set(ethAccounts)),
        },
      ],
    },
  };
  res.result = Object.values(transformedPermissions);
  return end();
}
