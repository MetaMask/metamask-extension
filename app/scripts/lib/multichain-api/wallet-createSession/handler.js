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
import { shouldEmitDappViewedEvent } from '../../util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { assignAccountsToScopes, validateAndAddEip3085 } from './helpers';

export async function walletCreateSessionHandler(req, res, _next, end, hooks) {
  // TODO: Does this handler need a rate limiter/lock like the one in eth_requestAccounts?

  const {
    origin,
    params: {
      requiredScopes,
      optionalScopes,
      sessionProperties,
      scopedProperties,
    },
  } = req;

  if (sessionProperties && Object.keys(sessionProperties).length === 0) {
    return end(
      new EthereumRpcError(5302, 'Invalid sessionProperties requested'),
    );
  }

  const chainIdsForNetworksAdded = [];

  try {
    const { flattenedRequiredScopes, flattenedOptionalScopes } =
      validateAndFlattenScopes(requiredScopes, optionalScopes);

    const validScopedProperties = processScopedProperties(
      flattenedRequiredScopes,
      flattenedOptionalScopes,
      scopedProperties,
    );

    const existsNetworkClientForChainId = (chainId) => {
      try {
        hooks.findNetworkClientIdByChainId(chainId);
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
    const legacyApproval = await hooks.requestPermissionApprovalForOrigin({
      [RestrictedMethods.eth_accounts]: {},
    });
    assignAccountsToScopes(
      supportedRequiredScopes,
      legacyApproval.approvedAccounts,
    );
    assignAccountsToScopes(
      supportableRequiredScopes,
      legacyApproval.approvedAccounts,
    );
    assignAccountsToScopes(
      supportedOptionalScopes,
      legacyApproval.approvedAccounts,
    );
    assignAccountsToScopes(
      supportableOptionalScopes,
      legacyApproval.approvedAccounts,
    );

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

        const chainId = await validateAndAddEip3085({
          eip3085Params: scopedProperties[scopeString].eip3085,
          addNetwork: hooks.addNetwork,
          findNetworkClientIdByChainId: hooks.findNetworkClientIdByChainId,
        });

        if (chainId) {
          chainIdsForNetworksAdded.push(chainId);
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
                isMultichainOrigin: true,
              },
            },
          ],
        },
      },
    });

    // TODO: Contact analytics team for how they would prefer to track this
    // first time connection to dapp will lead to no log in the permissionHistory
    // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
    // we will leverage that to identify `is_first_visit` for metrics
    if (shouldEmitDappViewedEvent(hooks.metamaskState.metaMetricsId)) {
      const isFirstVisit = !Object.keys(
        hooks.metamaskState.permissionHistory,
      ).includes(origin);

      hooks.sendMetrics({
        event: MetaMetricsEventName.DappViewed,
        category: MetaMetricsEventCategory.InpageProvider,
        referrer: {
          url: origin,
        },
        properties: {
          is_first_visit: isFirstVisit,
          number_of_accounts: Object.keys(hooks.metamaskState.accounts).length,
          number_of_accounts_connected: legacyApproval.approvedAccounts.length,
        },
      });
    }

    res.result = {
      sessionScopes,
      sessionProperties,
    };
    return end();
  } catch (err) {
    chainIdsForNetworksAdded.forEach((chainId) => {
      hooks.removeNetwork(chainId);
    });
    return end(err);
  }
}
