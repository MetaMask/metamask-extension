import { EthereumRpcError } from 'eth-rpc-errors';
import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import { parseAccountId } from '@metamask/snaps-utils';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  isSupportedScopeString,
  isSupportedNotification,
  isValidScope,
  flattenScope,
  mergeFlattenedScopes,
  isSupportedAccount,
} from './scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';

const validRpcMethods = MetaMaskOpenRPCDocument.methods.map(({ name }) => name);

// DRY THIS
function unique(list) {
  return Array.from(new Set(list));
}

// {
//   "requiredScopes": {
//     "eip155": {
//       "scopes": ["eip155:1", "eip155:137"],
//       "methods": ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "get_balance", "personal_sign"],
//       "notifications": ["accountsChanged", "chainChanged"]
//     },
//     "eip155:10": {
//       "methods": ["get_balance"],
//       "notifications": ["accountsChanged", "chainChanged"]
//     },
//     "wallet": {
//       "methods": ["wallet_getPermissions", "wallet_creds_store", "wallet_creds_verify", "wallet_creds_issue", "wallet_creds_present"],
//       "notifications": []
//     },
//     "cosmos": {
//       ...
//     }
//   },
//   "optionalScopes":{
//     "eip155:42161": {
//       "methods": ["eth_sendTransaction", "eth_signTransaction", "get_balance", "personal_sign"],
//       "notifications": ["accountsChanged", "chainChanged"]
//   },
//   "sessionProperties": {
//     "expiry": "2022-12-24T17:07:31+00:00",
//     "caip154-mandatory": "true"
//   }
// }

export const validateScopes = (requiredScopes, optionalScopes) => {
  const validRequiredScopes = {};
  for (const [scopeString, scopeObject] of Object.entries(requiredScopes)) {
    if (isValidScope(scopeString, scopeObject)) {
      validRequiredScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (requiredScopes && Object.keys(validRequiredScopes).length === 0) {
    // What error code and message here?
    throw new Error(
      '`requiredScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  const validOptionalScopes = {};
  for (const [scopeString, scopeObject] of Object.entries(optionalScopes)) {
    if (isValidScope(scopeString, scopeObject)) {
      validOptionalScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (optionalScopes && Object.keys(validOptionalScopes).length === 0) {
    // What error code and message here?
    throw new Error(
      '`optionalScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  return {
    validRequiredScopes,
    validOptionalScopes,
  };
};

export const flattenScopes = (scopes) => {
  let flattenedScopes = {};
  Object.keys(scopes).forEach((scopeString) => {
    const flattenedScopeMap = flattenScope(scopeString, scopes[scopeString]);
    flattenedScopes = mergeFlattenedScopes(flattenedScopes, flattenedScopeMap);
  });

  return flattenedScopes;
};

export const assertScopesSupported = (
  scopes,
  { findNetworkClientIdByChainId, getInternalAccounts },
) => {
  // TODO: Should we be less strict validating optional scopes? As in we can
  // drop parts or the entire optional scope when we hit something invalid which
  // is not true for the required scopes.

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

  if (Object.keys(scopes).length === 0) {
    throw new EthereumRpcError(5000, 'Unknown error with request');
  }

  // TODO:
  // When user disapproves accepting calls with the request methods
  //   code = 5001
  //   message = "User disapproved requested methods"
  // When user disapproves accepting calls with the request notifications
  //   code = 5002
  //   message = "User disapproved requested notifications"

  for (const [
    scopeString,
    { methods, notifications, accounts },
  ] of Object.entries(scopes)) {
    if (!isSupportedScopeString(scopeString, findNetworkClientIdByChainId)) {
      throw new EthereumRpcError(5100, 'Requested chains are not supported');
    }

    // Needs to be split by namespace?
    const allMethodsSupported = methods.every((method) =>
      validRpcMethods.includes(method),
    );
    if (!allMethodsSupported) {
      // not sure which one of these to use
      // When provider evaluates requested methods to not be supported
      //   code = 5101
      //   message = "Requested methods are not supported"
      // When provider does not recognize one or more requested method(s)
      //   code = 5201
      //   message = "Unknown method(s) requested"

      throw new EthereumRpcError(5101, 'Requested methods are not supported');
    }

    if (notifications && !notifications.every(isSupportedNotification)) {
      // not sure which one of these to use
      // When provider evaluates requested notifications to not be supported
      //   code = 5102
      //   message = "Requested notifications are not supported"
      // When provider does not recognize one or more requested notification(s)
      //   code = 5202
      //   message = "Unknown notification(s) requested"
      throw new EthereumRpcError(
        5102,
        'Requested notifications are not supported',
      );
    }

    if (accounts) {
      const accountsSupported = accounts.every((account) =>
        isSupportedAccount(account, getInternalAccounts),
      );

      if (!accountsSupported) {
        // TODO: There is no error code or message specified in the CAIP-25 spec for when accounts are not supported
        // The below is made up
        throw new EthereumRpcError(
          5103,
          'Requested accounts are not supported',
        );
      }
    }
  }
};

// TODO: Awful name. I think the other helpers need to be renamed as well
export const processScopes = (
  requiredScopes,
  optionalScopes,
  { findNetworkClientIdByChainId, getInternalAccounts },
) => {
  const { validRequiredScopes, validOptionalScopes } = validateScopes(
    requiredScopes,
    optionalScopes,
  );

  // TODO: determine is merging is a valid strategy
  const flattenedRequiredScopes = flattenScopes(validRequiredScopes);
  const flattenedOptionalScopes = flattenScopes(validOptionalScopes);

  assertScopesSupported(flattenedRequiredScopes, {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  });
  assertScopesSupported(flattenedOptionalScopes, {
    findNetworkClientIdByChainId,
    getInternalAccounts,
  });

  return {
    flattenedRequiredScopes,
    flattenedOptionalScopes,
  };
};

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
      sessionScopes: mergeFlattenedScopes(
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
