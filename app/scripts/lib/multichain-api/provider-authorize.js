import { EthereumRpcError } from 'eth-rpc-errors';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { validateAddEthereumChainParams } from '../rpc-method-middleware/handlers/ethereum-chain-utils';
import { processScopes, mergeScopes, parseScopeString, KnownCaipNamespace } from './scope';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from './caip25permissions';
import { toHex } from '@metamask/controller-utils';

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

  try {
    const { flattenedRequiredScopes, flattenedOptionalScopes } = processScopes(
      requiredScopes,
      optionalScopes,
      { findNetworkClientIdByChainId },
    );

    // use old account popup for now to get the accounts
    const [subjectPermission] = await hooks.requestPermissions(
      { origin },
      {
        [RestrictedMethods.eth_accounts]: {},
      },
    );
    const permittedAccounts = getAccountsFromPermission(subjectPermission);

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

    const sessionScopes = mergeScopes(
      flattenedRequiredScopes,
      flattenedOptionalScopes,
    );


    console.log({scopedProperties})

    await Promise.all(
      Object.keys(scopedProperties || {}).map(async (scopeString) => {
        let namespace, reference;
        try {
          ({namespace, reference} = parseScopeString(scopeString))

          if (!namespace || !reference) {
            return;
          }

          if (namespace !== KnownCaipNamespace.Eip155) {
            return;
          }
        } catch (err) {
          return;
        }

        const scope = sessionScopes[scopeString];
        if (!scope) {
          // scopedProperty defined for scope without authorization
          console.log('skipping because missing matching scope', {scopeString})
          return;
        }


        const eip3085Params = scopedProperties[scopeString].eip3085;
        if (!eip3085Params) {
          console.log('skipping because missing eip3085', {scopeString})
          return;
        }

        let validParams;
        try {
          validParams = validateAddEthereumChainParams(eip3085Params, end);
        } catch (error) {
          // return end(error);
          console.log('skipping because invalid', {scopeString})
          return;
        }

        const {
          chainId,
          chainName,
          firstValidBlockExplorerUrl,
          firstValidRPCUrl,
          ticker,
        } = validParams;

        if (chainId !== toHex(reference)) {
          return;
        }

        await hooks.upsertNetworkConfiguration(
          {
            chainId,
            rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
            nickname: chainName,
            rpcUrl: firstValidRPCUrl,
            ticker,
          },
          { source: 'dapp', referrer: origin },
        );
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
      sessionScopes,
      sessionProperties,
    };
    return end();
  } catch (err) {
    return end(err);
  }
}
