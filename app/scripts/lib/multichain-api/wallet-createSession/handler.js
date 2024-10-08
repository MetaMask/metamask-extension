import { EthereumRpcError } from 'eth-rpc-errors';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import {
  mergeScopes,
  validateAndFlattenScopes,
  processScopedProperties,
  bucketScopes,
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
import { PermissionNames } from '../../../controllers/permissions';
import {
  getEthAccounts,
  setEthAccounts,
} from '../adapters/caip-permission-adapter-eth-accounts';
import {
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from '../adapters/caip-permission-adapter-permittedChains';
import { validateAndAddEip3085 } from './helpers';

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

    // These should be EVM accounts already although the name does not necessary imply that
    // These addresses are lowercased already
    const existingEvmAddresses = hooks
      .listAccounts()
      .map((account) => account.address);
    const supportedEthAccounts = getEthAccounts({
      requiredScopes: supportedRequiredScopes,
      optionalScopes: supportedOptionalScopes,
    })
      .map((address) => address.toLowerCase())
      .filter((address) => existingEvmAddresses.includes(address));
    const supportedEthChainIds = getPermittedEthChainIds({
      requiredScopes: supportedRequiredScopes,
      optionalScopes: supportedOptionalScopes,
    });

    const legacyApproval = await hooks.requestPermissionApprovalForOrigin({
      [PermissionNames.eth_accounts]: {
        caveats: [
          {
            type: CaveatTypes.restrictReturnedAccounts,
            value: supportedEthAccounts,
          },
        ],
      },
      [PermissionNames.permittedChains]: {
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: supportedEthChainIds,
          },
        ],
      },
    });

    let caip25CaveatValue = {
      requiredScopes: supportedRequiredScopes,
      optionalScopes: supportedOptionalScopes,
      isMultichainOrigin: true,
      // TODO: preserve sessionProperties?
    };

    caip25CaveatValue = setPermittedEthChainIds(
      caip25CaveatValue,
      legacyApproval.approvedChainIds,
    );
    caip25CaveatValue = setEthAccounts(
      caip25CaveatValue,
      legacyApproval.approvedAccounts,
    );

    const sessionScopes = mergeScopes(
      caip25CaveatValue.requiredScopes,
      caip25CaveatValue.optionalScopes,
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
              value: caip25CaveatValue,
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
