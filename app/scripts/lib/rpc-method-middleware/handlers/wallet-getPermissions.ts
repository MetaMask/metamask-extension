import {
  CaveatSpecificationConstraint,
  MethodNames,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import { PermissionNames } from '../../../controllers/permissions';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';

type GetAccounts = () => string[];

type GetPermissionsForOrigin = () => ReturnType<
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >['getPermissions']
>;

export type GetPermissionsHooks = {
  getAccounts: GetAccounts;
  getPermissionsForOrigin: GetPermissionsForOrigin;
};

type GetPermissionsConstraint = MethodHandler<
  GetPermissionsHooks,
  never,
  Json[]
>;

export const getPermissionsHandler = {
  implementation: getPermissionsImplementation,
  hookNames: {
    getPermissionsForOrigin: true,
    getAccounts: true,
  },
} satisfies GetPermissionsConstraint;

const getPermissionsHandlers = {
  [MethodNames.GetPermissions]: getPermissionsHandler,
};

export default getPermissionsHandlers;

/**
 * Get Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param _req - The JsonRpcEngine request - unused
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getPermissionsForOrigin - The specific method hook needed for this method implementation
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 * @returns A promise that resolves to nothing
 */
async function getPermissionsImplementation(
  _req: JsonRpcRequest<Json[]>,
  res: PendingJsonRpcResponse<Json>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getPermissionsForOrigin, getAccounts }: GetPermissionsHooks,
) {
  const permissions = { ...getPermissionsForOrigin() };
  const caip25Endowment = permissions[Caip25EndowmentPermissionName];
  const caip25CaveatValue = caip25Endowment?.caveats?.find(
    ({ type }) => type === Caip25CaveatType,
  )?.value as Caip25CaveatValue | undefined;
  delete permissions[Caip25EndowmentPermissionName];

  if (caip25CaveatValue) {
    // We cannot derive ethAccounts directly from the CAIP-25 permission
    // because the accounts will not be in order of lastSelected
    const ethAccounts = getAccounts();

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

    const ethChainIds = getPermittedEthChainIds(caip25CaveatValue);

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
