import { pick } from 'lodash';
import { isPlainObject } from '@metamask/controller-utils';
import { invalidParams, MethodNames } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { PermissionNames } from '../../controllers/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { setEthAccounts } from './adapters/caip-permission-adapter-eth-accounts';
import { setPermittedEthChainIds } from './adapters/caip-permission-adapter-permittedChains';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.requestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    requestPermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    updateCaveat: true,
    grantPermissions: true,
    requestPermissionApprovalForOrigin: true,
  },
};

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
 * @returns A promise that resolves to nothing
 */
async function requestPermissionsImplementation(
  req,
  res,
  _next,
  end,
  {
    requestPermissionsForOrigin,
    getPermissionsForOrigin,
    updateCaveat,
    grantPermissions,
    requestPermissionApprovalForOrigin,
  },
) {
  const { origin, params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  const [requestedPermissions] = params;
  const caip25Permission = requestedPermissions[Caip25EndowmentPermissionName];
  delete requestedPermissions[Caip25EndowmentPermissionName];

  const legacyRequestedPermissions = pick(requestedPermissions, [
    RestrictedMethods.eth_accounts,
    PermissionNames.permittedChains,
  ]);
  delete requestedPermissions[RestrictedMethods.eth_accounts];
  delete requestedPermissions[PermissionNames.permittedChains];

  let legacyApproval;
  if (Object.keys(legacyRequestedPermissions).length > 0) {
    if (
      caip25Permission &&
      caip25Permission.caveats[0].value.isMultichainOrigin
    ) {
      return end(
        new Error(
          'cannot modify eth_accounts when CAIP-25 permission from multichain flow exists',
        ),
      ); // TODO: better error
    }

    legacyApproval = await requestPermissionApprovalForOrigin(
      legacyRequestedPermissions,
    );
  }

  let grantedPermissions = {};
  if (
    (Object.keys(requestedPermissions).length === 0 && !legacyApproval) ||
    Object.keys(requestedPermissions).length > 0
  ) {
    const [_grantedPermissions] = await requestPermissionsForOrigin(
      requestedPermissions,
    );
    // permissions are frozen and must be cloned before modified
    grantedPermissions = { ..._grantedPermissions };
  }

  if (legacyApproval) {
    // NOTE: the eth_accounts/permittedChains approvals will be combined in the future.
    // We assume that approvedAccounts and permittedChains are both defined here.
    // Until they are actually combined, when testing, you must request both
    // eth_accounts and permittedChains together.
    let caveatValue = {
      requiredScopes: {},
      optionalScopes: {},
      isMultichainOrigin: false,
    };
    caveatValue = setPermittedEthChainIds(
      caveatValue,
      legacyApproval.approvedChainIds,
    );

    caveatValue = setEthAccounts(caveatValue, legacyApproval.approvedAccounts);

    const permissions = getPermissionsForOrigin(origin) || {};
    let caip25Endowment = permissions[Caip25EndowmentPermissionName];
    const existingCaveat = caip25Endowment?.caveats.find(
      ({ type }) => type === Caip25CaveatType,
    );
    if (existingCaveat) {
      if (existingCaveat.value.isMultichainOrigin) {
        return end(
          new Error('cannot modify permission granted from multichain flow'),
        ); // TODO: better error
      }

      updateCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        caveatValue,
      );
    } else {
      caip25Endowment = grantPermissions({
        subject: { origin },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: caveatValue,
              },
            ],
          },
        },
      })[Caip25EndowmentPermissionName];
    }

    grantedPermissions[RestrictedMethods.eth_accounts] = {
      ...caip25Endowment,
      parentCapability: RestrictedMethods.eth_accounts,
      caveats: [
        {
          type: CaveatTypes.restrictReturnedAccounts,
          value: legacyApproval.approvedAccounts,
        },
      ],
    };

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

  res.result = Object.values(grantedPermissions);
  return end();
}
