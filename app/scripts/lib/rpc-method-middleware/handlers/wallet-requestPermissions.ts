import { pick } from 'lodash';
import { isPlainObject } from '@metamask/controller-utils';
import {
  Caveat,
  CaveatSpecificationConstraint,
  invalidParams,
  MethodNames,
  PermissionController,
  PermissionSpecificationConstraint,
  RequestedPermissions,
  ValidPermission,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/multichain';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.RequestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    getAccounts: true,
    requestPermissionsForOrigin: true,
    requestCaip25PermissionForOrigin: true,
  },
};

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];

/**
 * Request Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getAccounts
 * @param options.requestCaip25PermissionForOrigin
 * @param options.requestPermissionsForOrigin
 * @returns A promise that resolves to nothing
 */
async function requestPermissionsImplementation(
  req: JsonRpcRequest<[RequestedPermissions]> & { origin: string },
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    requestPermissionsForOrigin,
    requestCaip25PermissionForOrigin,
  }: {
    getAccounts: () => string[];
    requestPermissionsForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<[GrantedPermissions]>;
    requestCaip25PermissionForOrigin: (
      requestedPermissions?: RequestedPermissions,
    ) => Promise<
      ValidPermission<
        typeof Caip25EndowmentPermissionName,
        Caveat<typeof Caip25CaveatType, Caip25CaveatValue>
      >
    >;
  },
) {
  const { params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  const [requestedPermissions] = params;
  const caip25EquivalentPermissions: Partial<
    Pick<RequestedPermissions, 'eth_accounts' | 'endowment:permitted-chains'>
  > = pick(requestedPermissions, [
    RestrictedMethods.eth_accounts,
    PermissionNames.permittedChains,
  ]);
  delete requestedPermissions[RestrictedMethods.eth_accounts];
  delete requestedPermissions[PermissionNames.permittedChains];

  const hasCaip25EquivalentPermissions =
    Object.keys(caip25EquivalentPermissions).length > 0;
  const hasOtherRequestedPermissions =
    Object.keys(requestedPermissions).length > 0;

  let grantedPermissions: GrantedPermissions = {};
  let didGrantOtherPermissions;

  if (hasOtherRequestedPermissions || !hasCaip25EquivalentPermissions) {
    try {
      const [frozenGrantedPermissions] = await requestPermissionsForOrigin(
        requestedPermissions,
      );
      // permissions are frozen and must be cloned before modified
      grantedPermissions = { ...frozenGrantedPermissions };
      didGrantOtherPermissions = true;
    } catch (error) {
      if (!hasCaip25EquivalentPermissions) {
        return end(error as unknown as Error);
      }
    }
  }

  let caip25Endowment;
  let caip25CaveatValue;
  if (hasCaip25EquivalentPermissions) {
    try {
      caip25Endowment = await requestCaip25PermissionForOrigin(
        caip25EquivalentPermissions,
      );
      caip25CaveatValue = caip25Endowment?.caveats?.find(
        ({ type }) => type === Caip25CaveatType,
      )?.value as Caip25CaveatValue | undefined;

      if (!caip25CaveatValue) {
        throw new Error(
          `could not find ${Caip25CaveatType} in granted ${Caip25EndowmentPermissionName} permission.`,
        );
      }

      // We cannot derive correct eth_accounts value directly from the CAIP-25 permission
      // because the accounts will not be in order of lastSelected
      const ethAccounts = getAccounts();

      grantedPermissions[RestrictedMethods.eth_accounts] = {
        ...caip25Endowment,
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ethAccounts,
          },
        ],
      };

      const ethChainIds = getPermittedEthChainIds(caip25CaveatValue);
      if (ethChainIds.length > 0) {
        grantedPermissions[PermissionNames.permittedChains] = {
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
    } catch (error) {
      if (!didGrantOtherPermissions) {
        return end(error as unknown as Error);
      }
    }
  }

  res.result = Object.values(grantedPermissions).filter(
    (value) => value !== undefined,
  ) as Json;
  return end();
}
