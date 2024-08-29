import { isPlainObject } from '@metamask/controller-utils';
import { invalidParams, MethodNames } from '@metamask/permission-controller';
import { KnownCaipNamespace, parseCaipAccountId } from '@metamask/utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { mergeScopes, validNotifications, validRpcMethods } from './scope';

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
  delete requestedPermissions[Caip25EndowmentPermissionName];

  const [_grantedPermissions] = await requestPermissionsForOrigin(
    requestedPermissions,
  );

  // caveat values are frozen and must be cloned before modified
  const grantedPermissions = { ..._grantedPermissions };

  const ethAccountsPermission =
    grantedPermissions[RestrictedMethods.eth_accounts];

  if (process.env.BARAD_DUR && ethAccountsPermission) {
    // TODO: Use permittedChains permission returned from requestPermissionsForOrigin() when available
    const { chainId } = getNetworkConfigurationByNetworkClientId(
      req.networkClientId,
    );

    const scopeString = `eip155:${parseInt(chainId, 16)}`;

    const ethAccounts = ethAccountsPermission.caveats[0].value;

    const caipAccounts = ethAccounts.map(
      (account) => `${scopeString}:${account}`,
    );

    const permissions = getPermissionsForOrigin(origin);
    const caip25Endowment = permissions[Caip25EndowmentPermissionName];
    const caip25Caveat = caip25Endowment?.caveats.find(
      ({ type }) => type === Caip25CaveatType,
    );
    if (caip25Caveat) {
      const { optionalScopes, ...caveatValue } = caip25Caveat.value;
      const optionalScope = {
        methods: validRpcMethods,
        notifications: validNotifications,
        accounts: [],
        // caveat values are frozen and must be cloned before modified
        // this spread comes intentionally after the properties above
        ...optionalScopes[scopeString],
      };

      optionalScope.accounts = Array.from(
        new Set([...optionalScope.accounts, ...caipAccounts]),
      );

      const newOptionalScopes = {
        ...caip25Caveat.value.optionalScopes,
        [scopeString]: optionalScope,
      };

      updateCaveat(origin, Caip25EndowmentPermissionName, Caip25CaveatType, {
        ...caveatValue,
        optionalScopes: newOptionalScopes,
      });

      const sessionScopes = mergeScopes(
        caip25Caveat.value.requiredScopes,
        caip25Caveat.value.optionalScopes,
      );

      Object.entries(sessionScopes).forEach(([_, { accounts }]) => {
        accounts?.forEach((account) => {
          const {
            address,
            chain: { namespace },
          } = parseCaipAccountId(account);

          if (namespace === KnownCaipNamespace.Eip155) {
            ethAccounts.push(address);
          }
        });
      });

      grantedPermissions[RestrictedMethods.eth_accounts] = {
        ...caip25Endowment,
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: Array.from(new Set(ethAccounts)),
          },
        ],
      };
    } else {
      const caip25GrantedPermissions = grantPermissions({
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
                      methods: validRpcMethods,
                      notifications: validNotifications,
                      accounts: caipAccounts,
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      });

      grantedPermissions[RestrictedMethods.eth_accounts] = {
        ...caip25GrantedPermissions[Caip25EndowmentPermissionName],
        parentCapability: RestrictedMethods.eth_accounts,
        caveats: ethAccountsPermission.caveats,
      };
    }
  }

  res.result = Object.values(grantedPermissions);
  return end();
}
