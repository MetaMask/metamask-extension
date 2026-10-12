import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { merge } from 'lodash';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { Hex } from '@metamask/utils';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { isPayRpcTypeAllowed } from '../../../../shared/lib/transaction/pay-rpc';
import { addDappTransaction } from '../transaction/util';
import { walletPayErrors } from './errors';
import { getWalletPayTypeRegistry } from './registry';
import type {
  WalletPayDeps,
  WalletPayMessenger,
  WalletPayRequest,
  WalletPayResult,
  WalletPayTypeRegistry,
} from './types';
import { validateWalletPayRequest } from './validate-request';

// Relay resolves with this placeholder when it has no destination hash.
const RELAY_FALLBACK_HASH = '0x0';

/**
 * Handles a `wallet_pay` request: validates it, checks the flag and the
 * account, then adds the transaction and waits for its hash.
 *
 * @param options - Dependencies plus the requesting origin and request.
 * @param options.messenger - Root messenger.
 * @param options.getPermittedAccounts - Returns the origin's connected accounts.
 * @param options.securityAlertsEnabled - Whether security alerts are enabled.
 * @param options.origin - The requesting dApp's origin.
 * @param options.req - The JSON-RPC request.
 * @returns The `wallet_pay` result.
 */
export async function addWalletPayTransaction({
  messenger,
  getPermittedAccounts,
  securityAlertsEnabled,
  origin,
  req,
}: WalletPayDeps & {
  origin: string;
  req: WalletPayRequest;
}): Promise<WalletPayResult> {
  const params = validateWalletPayRequest(req.params);
  const typeRegistry = getAllowedTypeRegistry(messenger, origin, params.type);

  assertPermittedAccount(getPermittedAccounts(), params.from);
  await typeRegistry.assertPreconditions({ from: params.from, messenger });

  const built = typeRegistry.build(params);
  const networkClientId = await ensureNetwork(messenger, built.chainId);

  const hash = await addDappTransaction({
    messenger,
    internalAccounts: messenger.call('AccountsController:listAccounts'),
    selectedAccount: getAccount(messenger, params.from),
    networkClientId,
    chainId: built.chainId,
    transactionParams: built.transactionParams,
    securityAlertsEnabled,
    dappRequest: req,
    requestContext: new MiddlewareContext<Record<PropertyKey, unknown>>({
      origin,
      securityAlertResponse: req.securityAlertResponse,
      traceContext: req.traceContext,
    }),
    transactionOptions: {
      type: built.type,
      skipInitialGasEstimate: built.skipInitialGasEstimate,
    },
  });

  return hash && hash !== RELAY_FALLBACK_HASH
    ? { transactionHash: hash as Hex }
    : {};
}

function getAllowedTypeRegistry(
  messenger: WalletPayMessenger,
  origin: string,
  type: string,
): WalletPayTypeRegistry {
  const typeRegistry = getWalletPayTypeRegistry(type);
  // Manifest flags take precedence, matching the UI's getRemoteFeatureFlags.
  const remoteFeatureFlags = merge(
    {},
    messenger.call('RemoteFeatureFlagController:getState').remoteFeatureFlags,
    getManifestFlags().remoteFeatureFlags,
  );

  if (
    !typeRegistry ||
    !isPayRpcTypeAllowed({ remoteFeatureFlags }, origin, type)
  ) {
    throw walletPayErrors.unsupportedType(type);
  }

  return typeRegistry;
}

function assertPermittedAccount(permittedAccounts: string[], from: Hex) {
  const isPermitted = permittedAccounts.some(
    (account) => account.toLowerCase() === from.toLowerCase(),
  );

  if (!isPermitted) {
    throw walletPayErrors.unauthorizedAccount();
  }
}

async function ensureNetwork(
  messenger: WalletPayMessenger,
  chainId: Hex,
): Promise<string> {
  try {
    return messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );
  } catch {
    throw walletPayErrors.networkUnavailable(chainId);
  }
}

function getAccount(messenger: WalletPayMessenger, from: Hex): InternalAccount {
  const account = messenger.call(
    'AccountsController:getAccountByAddress',
    from,
  );

  if (!account) {
    throw walletPayErrors.unauthorizedAccount();
  }

  return account;
}
