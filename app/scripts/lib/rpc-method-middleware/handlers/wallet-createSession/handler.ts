import { JsonRpcError } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  setEthAccounts,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
  bucketScopes,
  validateAndNormalizeScopes,
  Caip25Authorization,
  ScopedProperties,
  getInternalScopesObject,
  getSessionScopes,
  NormalizedScopesObject,
  InternalScopeString,
  getSupportedScopeObjects,
} from '@metamask/multichain';
import {
  Caveat,
  CaveatSpecificationConstraint,
  invalidParams,
  PermissionController,
  PermissionSpecificationConstraint,
  RequestedPermissions,
  ValidPermission,
} from '@metamask/permission-controller';
import {
  CaipChainId,
  Hex,
  isPlainObject,
  Json,
  JsonRpcRequest,
  JsonRpcSuccess,
} from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { PermissionNames } from '../../../../controllers/permissions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../../util';
import { CaveatTypes } from '../../../../../../shared/constants/permissions';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';
import { processScopedProperties, validateAndAddEip3085 } from './helpers';

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

/**
 * Handler for the `wallet_createSession` RPC method.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param _next - The next middleware function.
 * @param end - The end function.
 * @param hooks - The hooks object.
 * @param hooks.listAccounts
 * @param hooks.removeNetwork
 * @param hooks.addNetwork
 * @param hooks.findNetworkClientIdByChainId
 * @param hooks.requestPermissionApproval
 * @param hooks.sendMetrics
 * @param hooks.metamaskState
 * @param hooks.metamaskState.metaMetricsId
 * @param hooks.metamaskState.permissionHistory
 * @param hooks.metamaskState.accounts
 * @param hooks.grantPermissions
 */
async function walletCreateSessionHandler(
  req: JsonRpcRequest<Caip25Authorization> & { origin: string },
  res: JsonRpcSuccess<{
    sessionScopes: NormalizedScopesObject;
    sessionProperties?: Record<string, Json>;
  }>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  hooks: {
    listAccounts: () => { address: string }[];
    removeNetwork: NetworkController['removeNetwork'];
    addNetwork: NetworkController['addNetwork'];
    findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
    requestPermissionApproval: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<{ approvedAccounts: Hex[]; approvedChainIds: Hex[] }>;
    sendMetrics: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
    metamaskState: {
      metaMetricsId: string;
      permissionHistory: Record<string, unknown>;
      accounts: Record<string, unknown>;
    };
    grantPermissions: (
      ...args: Parameters<AbstractPermissionController['grantPermissions']>
    ) => Record<string, ValidPermission<string, Caveat<string, Json>>>;
  },
) {
  const { origin } = req;
  if (!isPlainObject(req.params)) {
    return end(invalidParams({ data: { request: req } }));
  }
  const {
    requiredScopes,
    optionalScopes,
    sessionProperties,
    scopedProperties,
  } = req.params;

  if (sessionProperties && Object.keys(sessionProperties).length === 0) {
    return end(new JsonRpcError(5302, 'Invalid sessionProperties requested'));
  }

  const chainIdsForNetworksAdded: Hex[] = [];

  try {
    const { normalizedRequiredScopes, normalizedOptionalScopes } =
      validateAndNormalizeScopes(requiredScopes || {}, optionalScopes || {});

    const validScopedProperties = processScopedProperties(
      normalizedRequiredScopes,
      normalizedOptionalScopes,
      scopedProperties as ScopedProperties,
    );

    const supportedRequiredScopesObjects = getSupportedScopeObjects(
      normalizedRequiredScopes,
    );
    const supportedOptionalScopesObjects = getSupportedScopeObjects(
      normalizedOptionalScopes,
    );

    const existsNetworkClientForChainId = (chainId: Hex) => {
      try {
        hooks.findNetworkClientIdByChainId(chainId);
        return true;
      } catch (err) {
        return false;
      }
    };

    const existsEip3085ForChainId = (chainId: Hex) => {
      const scopeString: CaipChainId = `eip155:${parseInt(chainId, 16)}`;
      return Boolean(validScopedProperties?.[scopeString]?.eip3085);
    };

    const {
      supportedScopes: supportedRequiredScopes,
      supportableScopes: supportableRequiredScopes,
      unsupportableScopes: unsupportableRequiredScopes,
    } = bucketScopes(supportedRequiredScopesObjects, {
      isChainIdSupported: existsNetworkClientForChainId,
      isChainIdSupportable: existsEip3085ForChainId,
    });

    const {
      supportedScopes: supportedOptionalScopes,
      supportableScopes: supportableOptionalScopes,
      unsupportableScopes: unsupportableOptionalScopes,
    } = bucketScopes(supportedOptionalScopesObjects, {
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

    // Fetch EVM accounts from native wallet keyring
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

    const legacyApproval = await hooks.requestPermissionApproval({
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
      requiredScopes: getInternalScopesObject(supportedRequiredScopes),
      optionalScopes: getInternalScopesObject(supportedOptionalScopes),
      isMultichainOrigin: true,
      // NOTE: We aren't persisting sessionProperties from the CAIP-25
      // request because we don't do anything with it yet.
    };

    caip25CaveatValue = setPermittedEthChainIds(
      caip25CaveatValue,
      legacyApproval.approvedChainIds,
    );
    caip25CaveatValue = setEthAccounts(
      caip25CaveatValue,
      legacyApproval.approvedAccounts,
    );

    const sessionScopes = getSessionScopes(caip25CaveatValue);

    await Promise.all(
      Object.entries(validScopedProperties).map(
        async ([scopeString, scopedProperty]) => {
          const scope = sessionScopes[scopeString as InternalScopeString];
          if (!scope) {
            return;
          }

          const chainId = await validateAndAddEip3085({
            eip3085Params: scopedProperty.eip3085,
            addNetwork: hooks.addNetwork,
            findNetworkClientIdByChainId: hooks.findNetworkClientIdByChainId,
          });

          if (chainId) {
            chainIdsForNetworksAdded.push(chainId);
          }
        },
      ),
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

export const walletCreateSession = {
  methodNames: [MESSAGE_TYPE.WALLET_CREATE_SESSION],
  implementation: walletCreateSessionHandler,
  hookNames: {
    removeNetwork: true,
    findNetworkClientIdByChainId: true,
    listAccounts: true,
    addNetwork: true,
    requestPermissionApproval: true,
    grantPermissions: true,
    sendMetrics: true,
    metamaskState: true,
  },
};
