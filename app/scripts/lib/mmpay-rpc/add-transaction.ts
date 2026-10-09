import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { merge } from 'lodash';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { Hex } from '@metamask/utils';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { isPayRpcTypeAllowed } from '../../../../shared/lib/transaction/pay-rpc';
import { addDappTransaction } from '../transaction/util';
import { mmPayRpcErrors } from './errors';
import { watchMmPayRpcResult } from './result';
import { getMmPayRpcTypeRegistry } from './registry';
import type {
  MmPayRpcDeps,
  MmPayRpcMessenger,
  MmPayRpcRequest,
  MmPayRpcResult,
  MmPayRpcTypeRegistry,
} from './types';
import { validateMmPayRpcRequest } from './validate-request';

/**
 * Handles a `wallet_mmPay` request: validates it, checks the flag and the
 * account, then adds the transaction and waits for the result.
 *
 * @param options - Dependencies plus the requesting origin and request.
 * @param options.messenger - Root messenger.
 * @param options.getPermittedAccounts - Returns the origin's connected accounts.
 * @param options.securityAlertsEnabled - Whether security alerts are enabled.
 * @param options.origin - The requesting dApp's origin.
 * @param options.req - The JSON-RPC request.
 * @returns The `wallet_mmPay` result.
 */
export async function addMmPayRpcTransaction({
  messenger,
  getPermittedAccounts,
  securityAlertsEnabled,
  origin,
  req,
}: MmPayRpcDeps & {
  origin: string;
  req: MmPayRpcRequest;
}): Promise<MmPayRpcResult> {
  const {
    type,
    from,
    payParams: rawPayParams,
  } = validateMmPayRpcRequest(req.params);

  const typeRegistry = getAllowedTypeRegistry(messenger, origin, type);

  assertPermittedAccount(getPermittedAccounts(), from);

  const payParams = typeRegistry.validatePayParams(rawPayParams);
  await typeRegistry.assertPreconditions({ from, messenger });

  const built = typeRegistry.build({ from, payParams });
  const networkClientId = await ensureNetwork(messenger, built.chainId);
  const selectedAccount = getAccount(messenger, from);

  const watcher = watchMmPayRpcResult(messenger, {
    origin,
    requestId: String(req.id),
  });

  try {
    const hash = await addDappTransaction({
      messenger,
      internalAccounts: messenger.call('AccountsController:listAccounts'),
      selectedAccount,
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

    return watcher.buildResult(hash);
  } finally {
    watcher.stop();
  }
}

function getAllowedTypeRegistry(
  messenger: MmPayRpcMessenger,
  origin: string,
  type: string,
): MmPayRpcTypeRegistry {
  const typeRegistry = getMmPayRpcTypeRegistry(type);
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
    throw mmPayRpcErrors.unsupportedType(type);
  }

  return typeRegistry;
}

function assertPermittedAccount(permittedAccounts: string[], from: Hex) {
  const isPermitted = permittedAccounts.some(
    (account) => account.toLowerCase() === from.toLowerCase(),
  );

  if (!isPermitted) {
    throw mmPayRpcErrors.unauthorizedAccount();
  }
}

async function ensureNetwork(
  messenger: MmPayRpcMessenger,
  chainId: Hex,
): Promise<string> {
  try {
    return messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );
  } catch {
    throw mmPayRpcErrors.networkUnavailable(chainId);
  }
}

function getAccount(messenger: MmPayRpcMessenger, from: Hex): InternalAccount {
  const account = messenger.call(
    'AccountsController:getAccountByAddress',
    from,
  );

  if (!account) {
    throw mmPayRpcErrors.unauthorizedAccount();
  }

  return account;
}
