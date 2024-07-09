import { EthereumRpcError } from 'eth-rpc-errors';
import { parseAccountId } from '@metamask/snaps-utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { processScopes, mergeScopes } from './authorization';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

// DRY THIS
function unique(list) {
  return Array.from(new Set(list));
}

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

  const { findNetworkClientIdByChainId, getInternalAccounts } = hooks;

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
    const { flattenedRequiredScopes, flattenedOptionalScopes } = processScopes(
      requiredScopes,
      optionalScopes,
      { findNetworkClientIdByChainId, getInternalAccounts },
    );

    const accounts = [];
    Object.keys(flattenedRequiredScopes).forEach((scope) => {
      (flattenedRequiredScopes[scope].accounts || []).forEach(
        (caipAccountId) => {
          accounts.push(parseAccountId(caipAccountId).address);
        },
      );
    });
    Object.keys(flattenedOptionalScopes).forEach((scope) => {
      (flattenedOptionalScopes[scope].accounts || []).forEach(
        (caipAccountId) => {
          accounts.push(parseAccountId(caipAccountId).address);
        },
      );
    });

    if (accounts.length > 0) {
      await hooks.requestPermissions(
        { origin },
        {
          [RestrictedMethods.eth_accounts]: {
            caveats: [
              {
                type: CaveatTypes.restrictReturnedAccounts,
                value: unique(accounts),
              },
            ],
          },
        },
      );
    }

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

    // TODO: metrics/tracking after approval

    res.result = {
      sessionId,
      sessionScopes: mergeScopes(
        flattenedRequiredScopes,
        flattenedOptionalScopes,
      ),
      sessionProperties,
    };
    return end();
  } catch (err) {
    return end(err);
  }
}
