import { EthereumRpcError } from 'eth-rpc-errors';
import { RestrictedMethods } from '../../../../../shared/constants/permissions';
import {
  mergeScopes,
  processScopes,
  assertScopesSupported,
  filterScopesSupported,
  processScopedProperties,
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
    const { flattenedRequiredScopes, flattenedOptionalScopes } = processScopes(
      requiredScopes,
      optionalScopes,
    );

    const validScopedProperties = processScopedProperties(
      flattenedRequiredScopes,
      flattenedOptionalScopes,
      scopedProperties,
    );

    const existsNetworkClientOrEip3085ForChainId = (chainId) => {
      const scopeString = `eip155:${parseInt(chainId, 16)}`;
      if (validScopedProperties?.[scopeString]?.eip3085) {
        return true;
      }
      try {
        findNetworkClientIdByChainId(chainId);
        return true;
      } catch (err) {
        return false;
      }
    };

    const supportedRequiredScopes = flattenedRequiredScopes;
    assertScopesSupported(flattenedRequiredScopes, {
      existsNetworkClientForChainId: existsNetworkClientOrEip3085ForChainId,
    });

    const supportedOptionalScopes = filterScopesSupported(
      flattenedOptionalScopes,
      {
        existsNetworkClientForChainId: existsNetworkClientOrEip3085ForChainId,
      },
    );

    // use old account popup for now to get the accounts
    const [subjectPermission] = await hooks.requestPermissions(
      { origin },
      {
        [RestrictedMethods.eth_accounts]: {},
      },
    );
    const permittedAccounts = getAccountsFromPermission(subjectPermission);
    assignAccountsToScopes(supportedRequiredScopes, permittedAccounts);
    assignAccountsToScopes(supportedOptionalScopes, permittedAccounts);

    const sessionScopes = mergeScopes(
      supportedRequiredScopes,
      supportedOptionalScopes,
    );

    await Promise.all(
      Object.keys(scopedProperties || {}).map(async (scopeString) => {
        const scope = sessionScopes[scopeString];
        if (!scope) {
          return;
        }

        const networkClientId = await validateAndUpsertEip3085({
          scopeString,
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

    assertScopesSupported(sessionScopes, {
      existsNetworkClientForChainId: (...args) => {
        try {
          findNetworkClientIdByChainId(...args);
          return true;
        } catch (err) {
          return false;
        }
      },
    });

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
                requiredScopes: supportedRequiredScopes,
                optionalScopes: supportedOptionalScopes,
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
