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
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/multichain';
import {
  Hex,
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from 'json-rpc-engine';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';
// eslint-disable-next-line import/no-restricted-paths
import { isSnapId } from '../../../../../ui/helpers/utils/snaps';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.RequestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    requestPermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    updateCaveat: true,
    grantPermissions: true,
    requestPermissionApprovalForOrigin: true,
    getAccounts: true,
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
 * @param options.requestPermissionsForOrigin - The specific method hook needed for this method implementation
 * @param options.getPermissionsForOrigin
 * @param options.updateCaveat
 * @param options.grantPermissions
 * @param options.requestPermissionApprovalForOrigin
 * @param options.getAccounts
 * @returns A promise that resolves to nothing
 */
async function requestPermissionsImplementation(
  req: JsonRpcRequest<[RequestedPermissions]> & { origin: string },
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    requestPermissionsForOrigin,
    getPermissionsForOrigin,
    updateCaveat,
    grantPermissions,
    requestPermissionApprovalForOrigin,
    getAccounts,
  }: {
    requestPermissionsForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<[GrantedPermissions]>;
    updateCaveat: (
      origin: string,
      permissionName: string,
      caveatName: string,
      caveatValue: Caip25CaveatValue,
    ) => void;
    grantPermissions: (
      ...args: Parameters<AbstractPermissionController['grantPermissions']>
    ) => Record<string, ValidPermission<string, Caveat<string, Json>>>;
    requestPermissionApprovalForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<{ approvedAccounts: Hex[]; approvedChainIds: Hex[] }>;

    getPermissionsForOrigin: () => ReturnType<
      AbstractPermissionController['getPermissions']
    >;
    getAccounts: () => Promise<string[]>;
  },
) {
  const { origin, params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  const [requestedPermissions] = params;
  delete requestedPermissions[Caip25EndowmentPermissionName];

  const legacyRequestedPermissions: Partial<
    Pick<RequestedPermissions, 'eth_accounts' | 'endowment:permitted-chains'>
  > = pick(requestedPermissions, [
    RestrictedMethods.eth_accounts,
    PermissionNames.permittedChains,
  ]);
  delete requestedPermissions[RestrictedMethods.eth_accounts];
  delete requestedPermissions[PermissionNames.permittedChains];

  // We manually handle eth_accounts and permittedChains permissions
  // by calling the ApprovalController rather than the PermissionController
  // because these two permissions do not actually exist in the Permssion
  // Specifications. Calling the PermissionController with them will
  // cause an error to be thrown. Instead, we will use the approval result
  // from the ApprovalController to form a CAIP-25 permission later.
  let legacyApproval;
  const haveLegacyPermissions =
    Object.keys(legacyRequestedPermissions).length > 0;
  if (haveLegacyPermissions) {
    if (!legacyRequestedPermissions[RestrictedMethods.eth_accounts]) {
      legacyRequestedPermissions[RestrictedMethods.eth_accounts] = {};
    }

    if (!legacyRequestedPermissions[PermissionNames.permittedChains]) {
      legacyRequestedPermissions[PermissionNames.permittedChains] = {};
    }

    if (isSnapId(origin)) {
      delete legacyRequestedPermissions[PermissionNames.permittedChains];
    }

    legacyApproval = await requestPermissionApprovalForOrigin(
      legacyRequestedPermissions,
    );
  }

  let grantedPermissions: GrantedPermissions = {};
  // Request permissions from the PermissionController for any permissions other
  // than eth_accounts and permittedChains in the params. If no permissions
  // are in the params, then request empty permissions from the PermissionController
  // to get an appropriate error to be returned to the dapp.
  if (
    (Object.keys(requestedPermissions).length === 0 &&
      !haveLegacyPermissions) ||
    Object.keys(requestedPermissions).length > 0
  ) {
    const [_grantedPermissions] = await requestPermissionsForOrigin(
      requestedPermissions,
    );
    // permissions are frozen and must be cloned before modified
    grantedPermissions = { ..._grantedPermissions };
  }

  if (legacyApproval) {
    let newCaveatValue = {
      requiredScopes: {},
      optionalScopes: {},
      isMultichainOrigin: false,
    };
    if (!isSnapId(origin)) {
      newCaveatValue = setPermittedEthChainIds(
        newCaveatValue,
        legacyApproval.approvedChainIds,
      );
    }

    newCaveatValue = setEthAccounts(
      newCaveatValue,
      legacyApproval.approvedAccounts,
    );

    const permissions = getPermissionsForOrigin() || {};
    let caip25Endowment = permissions[Caip25EndowmentPermissionName];
    const existingCaveatValue = caip25Endowment?.caveats?.find(
      ({ type }) => type === Caip25CaveatType,
    )?.value as Caip25CaveatValue;
    if (existingCaveatValue) {
      if (existingCaveatValue.isMultichainOrigin) {
        return end(
          new Error(
            'Cannot modify permission granted via the Multichain API. Either modify the permission using the Multichain API or revoke permissions and request again.',
          ),
        );
      }

      updateCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        newCaveatValue,
      );
    } else {
      caip25Endowment = grantPermissions({
        subject: { origin },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: newCaveatValue,
              },
            ],
          },
        },
      })[Caip25EndowmentPermissionName];
    }

    // We cannot derive ethAccounts directly from the CAIP-25 permission
    // because the accounts will not be in order of lastSelected
    const ethAccounts = await getAccounts();

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

    if (!isSnapId(origin)) {
      grantedPermissions[PermissionNames.permittedChains] = {
        ...caip25Endowment,
        parentCapability: PermissionNames.permittedChains,
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: legacyApproval.approvedChainIds,
          },
        ],
      };
    }
  }

  res.result = Object.values(grantedPermissions) as Json;
  return end();
}
