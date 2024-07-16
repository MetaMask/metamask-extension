import { EthereumRpcError } from 'eth-rpc-errors';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { processScopes, mergeScopes } from './scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

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

  try {
    // use old account popup for now to get the accounts
    const [subjectPermission] = await hooks.requestPermissions(
      { origin },
      {
        [RestrictedMethods.eth_accounts]: {},
      },
    );
    const permittedAccounts = getAccountsFromPermission(subjectPermission);
    const { flattenedRequiredScopes, flattenedOptionalScopes } = processScopes(
      requiredScopes,
      optionalScopes,
      { findNetworkClientIdByChainId },
    );

    Object.keys(flattenedRequiredScopes).forEach((scope) => {
      if (scope !== 'wallet') {
        flattenedRequiredScopes[scope].accounts = permittedAccounts.map(
          (account) => `${scope}:${account}`,
        );
      }
    });
    Object.keys(flattenedOptionalScopes).forEach((scope) => {
      if (scope !== 'wallet') {
        flattenedOptionalScopes[scope].accounts = permittedAccounts.map(
          (account) => `${scope}:${account}`,
        );
      }
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
                requiredScopes: flattenedRequiredScopes,
                optionalScopes: flattenedOptionalScopes,
              },
            },
          ],
        },
      },
    });

    const mergedScopes = mergeScopes(
      flattenedRequiredScopes,
      flattenedOptionalScopes,
    );

    // clear per scope middleware
    hooks.multichainMiddlewareManager.removeAllMiddleware();
    hooks.subscriptionManager.unsubscribeAll();

    // if you added any notifications, like eth_subscribe
    // then we have to get the subscriptionManager going per scope
    Object.entries(mergedScopes).forEach(([scope]) => {
      const subscriptionManager = hooks.subscriptionManager.subscribe(scope);
      hooks.multichainMiddlewareManager.addMiddleware(
        subscriptionManager.middleware,
      );
    });

    // TODO: metrics/tracking after approval

    res.result = {
      sessionId,
      sessionScopes: mergedScopes,
      sessionProperties,
    };
    return end();
  } catch (err) {
    return end(err);
  }
}
