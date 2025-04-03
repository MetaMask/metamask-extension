import { JsonRpcError, rpcErrors } from '@metamask/rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  bucketScopes,
  validateAndNormalizeScopes,
  Caip25Authorization,
  getInternalScopesObject,
  getSessionScopes,
  NormalizedScopesObject,
  getSupportedScopeObjects,
  Caip25CaveatValue,
  setPermittedAccounts,
} from '@metamask/chain-agnostic-permission';
import {
  invalidParams,
  RequestedPermissions,
} from '@metamask/permission-controller';
import {
  CaipAccountId,
  CaipChainId,
  Hex,
  isPlainObject,
  Json,
  JsonRpcRequest,
  JsonRpcSuccess,
  KnownCaipNamespace,
  parseCaipAccountId,
} from '@metamask/utils';
import { NetworkController } from '@metamask/network-controller';
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { uniq } from 'lodash';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../../../shared/constants/metametrics';
import { shouldEmitDappViewedEvent } from '../../../util';
import { MESSAGE_TYPE } from '../../../../../../shared/constants/app';
import { GrantedPermissions } from '../types';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { isKnownSessionPropertyValue } from './constants';

/**
 * Handler for the `wallet_createSession` RPC method which is responsible
 * for prompting for approval and granting a CAIP-25 permission.
 *
 * This implementation primarily deviates from the CAIP-25 handler
 * specification by treating all scopes as optional regardless of
 * if they were specified in `requiredScopes` or `optionalScopes`.
 * Additionally, provided scopes, methods, notifications, and
 * account values that are invalid/malformed are ignored rather than
 * causing an error to be returned.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param _next - The next middleware function.
 * @param end - The end function.
 * @param hooks - The hooks object.
 * @param hooks.listAccounts - The hook that returns an array of the wallet's evm accounts.
 * @param hooks.findNetworkClientIdByChainId - The hook that returns the networkClientId for a chainId.
 * @param hooks.requestPermissionsForOrigin - The hook that approves and grants requested permissions.
 * @param hooks.sendMetrics - The hook that tracks an analytics event.
 * @param hooks.getNonEvmSupportedMethods - The hook that returns the supported methods for a non EVM scope.
 * @param hooks.isNonEvmScopeSupported - The hook that returns true if a non EVM scope is supported.
 * @param hooks.getNonEvmAccountAddresses - The hook that returns a list of CaipAccountIds that are supported for a CaipChainId.
 * @param hooks.metamaskState - The wallet state.
 * @param hooks.metamaskState.metaMetricsId - The analytics id.
 * @param hooks.metamaskState.permissionHistory - The permission history object keyed by origin.
 * @param hooks.metamaskState.accounts - The accounts object keyed by address.
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
    findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
    requestPermissionsForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<[GrantedPermissions]>;
    sendMetrics: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
    getNonEvmSupportedMethods: (scope: CaipChainId) => string[];
    isNonEvmScopeSupported: (scope: CaipChainId) => boolean;
    metamaskState: {
      metaMetricsId: string;
      permissionHistory: Record<string, unknown>;
      accounts: Record<string, unknown>;
    };
    getNonEvmAccountAddresses: (scope: CaipChainId) => CaipAccountId[];
  },
) {
  const { origin } = req;
  if (!isPlainObject(req.params)) {
    return end(invalidParams({ data: { request: req } }));
  }
  const { requiredScopes, optionalScopes, sessionProperties } = req.params;

  if (sessionProperties && Object.keys(sessionProperties).length === 0) {
    return end(new JsonRpcError(5302, 'Invalid sessionProperties requested'));
  }

  const filteredSessionProperties = Object.fromEntries(
    Object.entries(sessionProperties ?? {}).filter(([key]) =>
      isKnownSessionPropertyValue(key),
    ),
  );

  try {
    const { normalizedRequiredScopes, normalizedOptionalScopes } =
      validateAndNormalizeScopes(requiredScopes || {}, optionalScopes || {});

    const requiredScopesWithSupportedMethodsAndNotifications =
      getSupportedScopeObjects(normalizedRequiredScopes, {
        getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
      });
    const optionalScopesWithSupportedMethodsAndNotifications =
      getSupportedScopeObjects(normalizedOptionalScopes, {
        getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
      });

    const networkClientExistsForChainId = (chainId: Hex) => {
      try {
        hooks.findNetworkClientIdByChainId(chainId);
        return true;
      } catch (err) {
        return false;
      }
    };

    const { supportedScopes: supportedRequiredScopes } = bucketScopes(
      requiredScopesWithSupportedMethodsAndNotifications,
      {
        isEvmChainIdSupported: networkClientExistsForChainId,
        isEvmChainIdSupportable: () => false, // intended for future usage with eip3085 scopedProperties
        getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
        isNonEvmScopeSupported: hooks.isNonEvmScopeSupported,
      },
    );

    const { supportedScopes: supportedOptionalScopes } = bucketScopes(
      optionalScopesWithSupportedMethodsAndNotifications,
      {
        isEvmChainIdSupported: networkClientExistsForChainId,
        isEvmChainIdSupportable: () => false, // intended for future usage with eip3085 scopedProperties
        getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
        isNonEvmScopeSupported: hooks.isNonEvmScopeSupported,
      },
    );

    // Fetch EVM accounts from native wallet keyring
    const existingEvmAddresses = hooks
      .listAccounts()
      .map((account) => account.address);

    // TODO dry and or move to @metamask/chain-agnostic-permission
    const requiredAccounts = Object.values(supportedRequiredScopes).flatMap(
      (scope) => scope.accounts,
    );
    const optionalAccounts = Object.values(supportedOptionalScopes).flatMap(
      (scope) => scope.accounts,
    );

    const allAccountAddresses = uniq([
      ...requiredAccounts,
      ...optionalAccounts,
    ]);

    const supportedAccountAddresses = allAccountAddresses.filter(
      (accountAddress) => {
        const {
          address,
          chain: { namespace },
          chainId: caipChainId,
        } = parseCaipAccountId(accountAddress);
        if (namespace === KnownCaipNamespace.Eip155) {
          return existingEvmAddresses.some((existingEvmAddress) => {
            return isEqualCaseInsensitive(address, existingEvmAddress);
          });
        }

        const getNonEvmAccountAddressesForChainId =
          hooks.getNonEvmAccountAddresses(caipChainId);
        return getNonEvmAccountAddressesForChainId.some(
          (existingCaipAddress) => {
            return isEqualCaseInsensitive(accountAddress, existingCaipAddress);
          },
        );
      },
    );

    const requestedCaip25CaveatValue = {
      requiredScopes: getInternalScopesObject(supportedRequiredScopes),
      optionalScopes: getInternalScopesObject(supportedOptionalScopes),
      isMultichainOrigin: true,
      sessionProperties: filteredSessionProperties,
    };

    const requestedCaip25CaveatValueWithSupportedAccounts =
      setPermittedAccounts(
        requestedCaip25CaveatValue,
        supportedAccountAddresses,
      );

    // Note that we do not verify non-evm accounts here. Instead we rely on
    // the CAIP-25 caveat validator to throw an error about the requested
    // accounts being invalid. Once the Approval UI supports displaying and selecting
    // non-evm accounts and networks, we should add the non-evm account filtering
    // logic to this handler so that unsupported/invalid non-evm accounts
    // never make it into the approval request in the first place.

    const [grantedPermissions] = await hooks.requestPermissionsForOrigin({
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: requestedCaip25CaveatValueWithSupportedAccounts,
          },
        ],
      },
    });

    const approvedCaip25Permission =
      grantedPermissions[Caip25EndowmentPermissionName];
    const approvedCaip25CaveatValue = approvedCaip25Permission?.caveats?.find(
      (caveat) => caveat.type === Caip25CaveatType,
    )?.value as Caip25CaveatValue;
    if (!approvedCaip25CaveatValue) {
      throw rpcErrors.internal();
    }

    const sessionScopes = getSessionScopes(approvedCaip25CaveatValue, {
      getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
    });

    const { sessionProperties: approvedSessionProperties = {} } =
      approvedCaip25CaveatValue;

    // TODO: Contact analytics team for how they would prefer to track this
    // first time connection to dapp will lead to no log in the permissionHistory
    // and if user has connected to dapp before, the dapp origin will be included in the permissionHistory state
    // we will leverage that to identify `is_first_visit` for metrics
    if (shouldEmitDappViewedEvent(hooks.metamaskState.metaMetricsId)) {
      const isFirstVisit = !Object.keys(
        hooks.metamaskState.permissionHistory,
      ).includes(origin);

      const approvedEthAccounts = getEthAccounts(approvedCaip25CaveatValue);

      hooks.sendMetrics({
        event: MetaMetricsEventName.DappViewed,
        category: MetaMetricsEventCategory.InpageProvider,
        referrer: {
          url: origin,
        },
        properties: {
          is_first_visit: isFirstVisit,
          number_of_accounts: Object.keys(hooks.metamaskState.accounts).length,
          number_of_accounts_connected: approvedEthAccounts.length,
        },
      });
    }

    res.result = {
      sessionScopes,
      sessionProperties: approvedSessionProperties,
    };
    return end();
  } catch (err) {
    return end(err);
  }
}

export const walletCreateSession = {
  methodNames: [MESSAGE_TYPE.WALLET_CREATE_SESSION],
  implementation: walletCreateSessionHandler,
  hookNames: {
    findNetworkClientIdByChainId: true,
    listAccounts: true,
    requestPermissionsForOrigin: true,
    sendMetrics: true,
    metamaskState: true,
    getNonEvmSupportedMethods: true,
    isNonEvmScopeSupported: true,
    getNonEvmAccountAddresses: true,
  },
};
