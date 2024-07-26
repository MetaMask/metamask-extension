import { EthereumRpcError } from 'eth-rpc-errors';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import {
  mergeScopes,
  validateAndFlattenScopes,
  processScopedProperties,
  bucketScopes,
  assertScopesSupported,
} from '../scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../caip25permissions';
import { assignAccountsToScopes, validateAndUpsertEip3085 } from './helpers';

const getAccountsFromPermission = (permission) => {
  return permission.eth_accounts.caveats.find(
    (caveat) => caveat.type === 'restrictReturnedAccounts',
  )?.value;
};

// TODO:
// Unless the dapp is known and trusted, give generic error messages for
// - the user denies consent for exposing accounts that match the requested and approved chains,
// - the user denies consent for requested methods,
// - the user denies all requested or any required scope objects,
// - the wallet cannot support all requested or any required scope objects,
// - the requested chains are not supported by the wallet, or
// - the requested methods are not supported by the wallet
// return
//     "code": 0,
//     "message": "Unknown error"

// TODO:
// When user disapproves accepting calls with the request methods
//   code = 5001
//   message = "User disapproved requested methods"
// When user disapproves accepting calls with the request notifications
//   code = 5002
//   message = "User disapproved requested notifications"

export async function providerAuthorizeHandler(req, res, _next, end, hooks) {
  // TODO: Does this handler need a rate limiter/lock like the one in eth_requestAccounts?

  const {
    origin,
    params: {
      requiredScopes,
      optionalScopes,
      sessionProperties,
      scopedProperties,
      ...restParams
    },
  } = req;

  const { findNetworkClientIdByChainId } = hooks;

  if (Object.keys(restParams).length !== 0) {
    return end(
      new EthereumRpcError(
        5301,
        'Session Properties can only be optional and global',
      ),
    );
  }

  const sessionId = '0xdeadbeef';

  if (sessionProperties && Object.keys(sessionProperties).length === 0) {
    return end(
      new EthereumRpcError(5300, 'Invalid Session Properties requested'),
    );
  }

  const networkClientIdsAdded = [];

  try {
    const { flattenedRequiredScopes, flattenedOptionalScopes } = validateAndFlattenScopes(
      requiredScopes,
      optionalScopes,
    );

    const validScopedProperties = processScopedProperties(
      flattenedRequiredScopes,
      flattenedOptionalScopes,
      scopedProperties,
    );

    const existsNetworkClientForChainId = (chainId) => {
      try {
        findNetworkClientIdByChainId(chainId);
        return true;
      } catch (err) {
        return false;
      }
    };

    const existsEip3085ForChainId = (chainId) => {
      const scopeString = `eip155:${parseInt(chainId, 16)}`;
      return validScopedProperties?.[scopeString]?.eip3085;
    };

    const {
      supportedScopes: supportedRequiredScopes,
      supportableScopes: supportableRequiredScopes,
      unsupportableScopes: unsupportableRequiredScopes,
    } = bucketScopes(flattenedRequiredScopes, {
      isChainIdSupported: existsNetworkClientForChainId,
      isChainIdSupportable: existsEip3085ForChainId,
    });
    // We assert if the unsupportable scopes are supported in order
    // to have an appropriate error thrown for the response
    assertScopesSupported(unsupportableRequiredScopes, {
      isChainIdSupported: existsNetworkClientForChainId,
    });

    const {
      supportedScopes: supportedOptionalScopes,
      supportableScopes: supportableOptionalScopes,
      unsupportableScopes: unsupportableOptionalScopes,
    } = bucketScopes(flattenedOptionalScopes, {
      isChainIdSupported: existsNetworkClientForChainId,
      isChainIdSupportable: existsEip3085ForChainId,
    });

    // TODO: placeholder for future CAIP-25 permission confirmation call
    JSON.stringify({
      supportedRequiredScopes,
      supportableRequiredScopes,
      unsupportableRequiredScopes,
      supportedOptionalScopes,
      supportableOptionalScopes,
      unsupportableOptionalScopes,
    });

    // use old account popup for now to get the accounts
    const [subjectPermission] = await hooks.requestPermissions(
      { origin },
      {
        [RestrictedMethods.eth_accounts]: {},
      },
    );
    const permittedAccounts = getAccountsFromPermission(subjectPermission);
    assignAccountsToScopes(supportedRequiredScopes, permittedAccounts);
    assignAccountsToScopes(supportableRequiredScopes, permittedAccounts);
    assignAccountsToScopes(supportedOptionalScopes, permittedAccounts);
    assignAccountsToScopes(supportableOptionalScopes, permittedAccounts);

    const grantedRequiredScopes = mergeScopes(
      supportedRequiredScopes,
      supportableRequiredScopes,
    );
    const grantedOptionalScopes = mergeScopes(
      supportedOptionalScopes,
      supportableOptionalScopes,
    );
    const sessionScopes = mergeScopes(
      grantedRequiredScopes,
      grantedOptionalScopes,
    );

    await Promise.all(
      Object.keys(scopedProperties || {}).map(async (scopeString) => {
        const scope = sessionScopes[scopeString];
        if (!scope) {
          return;
        }

        const networkClientId = await validateAndUpsertEip3085({
          eip3085Params: scopedProperties[scopeString].eip3085,
          origin,
          upsertNetworkConfiguration: hooks.upsertNetworkConfiguration,
          findNetworkClientIdByChainId: hooks.findNetworkClientIdByChainId,
        });

        if (networkClientId) {
          networkClientIdsAdded.push(networkClientId);
        }
      }),
    );

    hooks.grantPermissions({
      subject: {
        origin,
      },
      approvedPermissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: grantedRequiredScopes,
                optionalScopes: grantedOptionalScopes,
              },
            },
          ],
        },
      },
    });

    // TODO: metrics/tracking after approval

    res.result = {
      sessionId,
      sessionScopes,
      sessionProperties,
    };
    return end();
  } catch (err) {
    networkClientIdsAdded.forEach((networkClientId) => {
      hooks.removeNetworkConfiguration(networkClientId);
    });
    return end(err);
  }
}
