import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import type {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  WalletPayHooks,
  WalletPayJsonRpcRequest,
  WalletPayTransaction,
} from '@metamask/transaction-pay-middleware';
import type { Hex } from '@metamask/utils';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { getRemoteFeatureFlags } from '../../../../shared/lib/selectors/remote-feature-flags';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import type { RootMessenger } from '../messenger';
import {
  addDappTransaction,
  type AddTransactionMessenger,
} from '../transaction/util';

export type WalletPayHooksMessenger = RootMessenger<
  | MessengerActions<AddTransactionMessenger>
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerListAccountsAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction,
  MessengerEvents<AddTransactionMessenger>
>;

type WalletPayHooksRequest = WalletPayJsonRpcRequest & {
  securityAlertResponse?: unknown;
  traceContext?: unknown;
};

/**
 * Builds the extension's hooks for `walletPay` from
 * `@metamask/transaction-pay-middleware`.
 *
 * @param options - Options.
 * @param options.messenger - Root messenger.
 * @param options.getPermittedAccounts - Returns the origin's connected accounts.
 * @param options.getSecurityAlertsEnabled - Whether security alerts are enabled.
 * @returns The `walletPay` hooks.
 */
export function createWalletPayHooks({
  messenger,
  getPermittedAccounts,
  getSecurityAlertsEnabled,
}: {
  messenger: WalletPayHooksMessenger;
  getPermittedAccounts: () => string[];
  getSecurityAlertsEnabled: () => boolean;
}): WalletPayHooks {
  return {
    getPermittedAccountsForOrigin: async () => getPermittedAccounts(),
    // Manifest flags take precedence, matching the UI's getRemoteFeatureFlags.
    getRemoteFeatureFlags: () =>
      getRemoteFeatureFlags({
        metamask: {
          remoteFeatureFlags: messenger.call(
            'RemoteFeatureFlagController:getState',
          ).remoteFeatureFlags,
        },
      }),
    addTransaction: (transaction, request) =>
      addWalletPayTransaction({
        messenger,
        securityAlertsEnabled: getSecurityAlertsEnabled(),
        transaction,
        request,
      }),
  };
}

async function addWalletPayTransaction({
  messenger,
  securityAlertsEnabled,
  transaction,
  request,
}: {
  messenger: WalletPayHooksMessenger;
  securityAlertsEnabled: boolean;
  transaction: WalletPayTransaction;
  request: WalletPayHooksRequest;
}): Promise<string | undefined> {
  const { chainId, transactionParams, type, skipInitialGasEstimate } =
    transaction;
  const selectedAccount = messenger.call(
    'AccountsController:getAccountByAddress',
    transactionParams.from,
  );

  if (!selectedAccount) {
    throw new Error(`No account for ${transactionParams.from}`);
  }

  return addDappTransaction({
    messenger,
    internalAccounts: messenger.call('AccountsController:listAccounts'),
    selectedAccount,
    networkClientId: await ensureNetwork(messenger, chainId),
    chainId,
    transactionParams,
    securityAlertsEnabled,
    dappRequest: request,
    requestContext: new MiddlewareContext<Record<PropertyKey, unknown>>({
      origin: request.origin,
      securityAlertResponse: request.securityAlertResponse,
      traceContext: request.traceContext,
    }),
    transactionOptions: { type, skipInitialGasEstimate },
  });
}

// Adds the chain from the featured networks when it isn't configured yet.
async function ensureNetwork(
  messenger: WalletPayHooksMessenger,
  chainId: Hex,
): Promise<string> {
  const { networkConfigurationsByChainId } = messenger.call(
    'NetworkController:getState',
  );

  if (!networkConfigurationsByChainId[chainId]) {
    const networkConfiguration = FEATURED_RPCS.find(
      (featured) => featured.chainId === chainId,
    );

    if (!networkConfiguration) {
      throw new Error(`Chain ${chainId} is not a featured network`);
    }

    await messenger.call(
      'LegacyBackgroundApiService:addNetwork',
      networkConfiguration,
      { setActive: false },
    );
  }

  return messenger.call(
    'NetworkController:findNetworkClientIdByChainId',
    chainId,
  );
}
