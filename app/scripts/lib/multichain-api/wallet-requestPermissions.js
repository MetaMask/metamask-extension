import { pick } from 'lodash';
import { isPlainObject } from '@metamask/controller-utils';
import { invalidParams, MethodNames } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { validNotifications, validRpcMethods } from './scope';
import { setEthAccounts } from './caip-permission-adapter-eth-accounts';
import { PermissionNames } from '../../controllers/permissions';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.requestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    requestPermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    getNetworkConfigurationByNetworkClientId: true,
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
 * @param options.getNetworkConfigurationByNetworkClientId
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
    getNetworkConfigurationByNetworkClientId,
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

  const legacyRequestedPermissions = pick(requestedPermissions, [RestrictedMethods.eth_accounts, PermissionNames.permittedChains])
  delete requestedPermissions[RestrictedMethods.eth_accounts]
  delete requestedPermissions[PermissionNames.permittedChains]

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

    legacyApproval = await requestPermissionApprovalForOrigin(legacyRequestedPermissions);
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

  const ethAccounts = legacyApproval?.approvedAccounts;
  if (ethAccounts) {
    // TODO: Use permittedChains permission returned from requestPermissionsForOrigin() when available
    const { chainId } = getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    );

    const scopeString = `eip155:${parseInt(chainId, 16)}`;

    const permissions = getPermissionsForOrigin(origin) || {};
    const caip25Endowment = permissions[Caip25EndowmentPermissionName];
    const caip25Caveat = caip25Endowment?.caveats.find(
      ({ type }) => type === Caip25CaveatType,
    );

    if (caip25Caveat) {
      if (caip25Caveat.value.isMultichainOrigin) {
        return end(
          new Error('cannot modify permission granted from multichain flow'),
        ); // TODO: better error
      }
      const updatedCaveatValue = setEthAccounts(
        caip25Caveat.value,
        ethAccounts,
      );

      updateCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        updatedCaveatValue,
      );

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
    } else {
      const caveatValue = setEthAccounts(
        {
          requiredScopes: {},
          optionalScopes: {
            [scopeString]: {
              methods: validRpcMethods,
              notifications: validNotifications,
              accounts: [],
            },
          },
          isMultichainOrigin: false,
        },
        ethAccounts,
      );

      const caip25GrantedPermissions = grantPermissions({
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
      });

      grantedPermissions[RestrictedMethods.eth_accounts] = {
        ...caip25GrantedPermissions[Caip25EndowmentPermissionName],
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ethAccounts,
          },
        ],
      };
    }
  }

  res.result = Object.values(grantedPermissions);
  return end();
}
