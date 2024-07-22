import { isPlainObject } from '@metamask/controller-utils';
import { invalidParams, MethodNames } from '@metamask/permission-controller';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.requestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    requestPermissionsForOrigin: true,
    getPermissionsForOrigin: true,
    getNetworkConfigurationByNetworkClientId: true,
    updateCaveat: true,
    grantPermissions: true,
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
  },
) {
  const { origin, params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  const [requestedPermissions] = params;
  const [grantedPermissions] = await requestPermissionsForOrigin(
    requestedPermissions,
  );

  const ethAccountsPermission =
    grantedPermissions[RestrictedMethods.eth_accounts];

  if (process.env.BARAD_DUR && ethAccountsPermission) {
    const { chainId } = getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    );

    const scopeString = `eip155:${parseInt(chainId, 16)}`;

    // kinda unsafe?
    const caipAccounts = ethAccountsPermission.caveats[0].value.map(
      (account) => `${scopeString}:${account}`,
    );

    const permissions = getPermissionsForOrigin(origin);
    const caip25endowment = permissions[Caip25EndowmentPermissionName];
    if (caip25endowment) {
      const caip25caveat = caip25endowment.caveats.find(
        ({ type }) => type === Caip25CaveatType,
      );
      if (!caip25caveat) {
        return 'what...';
      }

      const { optionalScopes, ...caveatValue } = caip25caveat.value;
      const optionalScope = {
        methods: [], // TODO grant all methods
        notifications: [], // TODO grant all notifications
        accounts: [],
        // caveat values are frozen and must be cloned before modified
        // this spread comes intentionally after the properties above
        ...optionalScopes[scopeString]
      };

      optionalScope.accounts = Array.from(
        new Set([...caipAccounts, ...optionalScope.accounts]),
      );

      updateCaveat(origin, Caip25EndowmentPermissionName, Caip25CaveatType, {
        ...caveatValue,
        optionalScopes: {
          ...caip25caveat.optionalScopes,
          [scopeString]: optionalScope,
        },
      });
    } else {
      grantPermissions(
        {
          subject: { origin },
          approvedPermissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      [scopeString]: {
                        methods: [], // TODO grant all methods
                        notifications: [], // TODO grant all notifications
                        accounts: caipAccounts,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      );
    }
  }

  // would it be better to only return eth_accounts instead?
  delete grantedPermissions[Caip25EndowmentPermissionName]

  res.result = Object.values(grantedPermissions);
  return end();
}
