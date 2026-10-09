import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { merge } from 'lodash';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { Hex } from '@metamask/utils';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { isPayRpcTypeAllowed } from '../../../../shared/lib/transaction/pay-rpc';
import { addDappTransaction } from '../transaction/util';
import { mmPayRpcErrors } from './errors';
import { watchMmPayRpcResult } from './result';
import { getMmPayRpcTypeDefinition } from './types/registry';
import type {
  MmPayRpcDeps,
  MmPayRpcMessenger,
  MmPayRpcRequest,
  MmPayRpcResult,
  MmPayRpcTypeDefinition,
} from './types';
import { validateMmPayRpcRequest } from './validate-request';

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

  const definition = getAllowedTypeDefinition(messenger, origin, type);

  assertPermittedAccount(getPermittedAccounts(), from);

  const payParams = definition.validatePayParams(rawPayParams);
  await definition.assertPreconditions({ from, messenger });

  const built = definition.build({ from, payParams });
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

function getAllowedTypeDefinition(
  messenger: MmPayRpcMessenger,
  origin: string,
  type: string,
): MmPayRpcTypeDefinition {
  const definition = getMmPayRpcTypeDefinition(type);
  // Manifest flags take precedence, matching the UI's getRemoteFeatureFlags.
  const remoteFeatureFlags = merge(
    {},
    messenger.call('RemoteFeatureFlagController:getState').remoteFeatureFlags,
    getManifestFlags().remoteFeatureFlags,
  );

  if (
    !definition ||
    !isPayRpcTypeAllowed({ remoteFeatureFlags }, origin, type)
  ) {
    throw mmPayRpcErrors.unsupportedType(type);
  }

  return definition;
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
