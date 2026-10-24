import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import type { Hex, JsonRpcRequest } from '@metamask/utils';

import {
  addDappTransaction,
  type AddTransactionMessenger,
} from '../transaction/util';
import { MMPAY_REGISTRY } from './registry';
import { buildMmPayResult, getQuoteSides } from './result';
import type { MmPayQuoteSides, MmPayResult } from './types';
import { toAmountRaw, validateMmPayParams } from './validate-params';

type CommonDeps = {
  messenger: AddTransactionMessenger;
  securityAlertsEnabled: boolean;
  ensureNetwork: (chainId: Hex) => Promise<string>;
};

type MmPayMessengerCall = {
  (action: 'RemoteFeatureFlagController:getState'): {
    remoteFeatureFlags?: Record<string, unknown>;
  };
  (
    action: 'AccountsController:getAccountByAddress',
    address: Hex,
  ): InternalAccount | undefined;
  (action: 'AccountsController:listAccounts'): InternalAccount[];
  (
    action: 'NetworkController:getNetworkConfigurationByNetworkClientId',
    networkClientId: string,
  ): { chainId: Hex };
};

/**
 * Adds an MMPay transaction from the dApp RPC flow.
 *
 * @param deps - Transaction dependencies and dApp request metadata.
 * @param rawParams - Raw MMPay params from the JSON-RPC request.
 * @returns The provider plus source/destination chains and hashes.
 */
export async function addMmPayDappTransaction(
  deps: CommonDeps & {
    from: Hex;
    dappRequest: JsonRpcRequest & {
      origin?: string;
      securityAlertResponse?: unknown;
      traceContext?: unknown;
    };
  },
  rawParams: unknown,
): Promise<MmPayResult> {
  const { dappRequest, from, messenger } = deps;
  const { base, builtTx } = await prepare(deps, rawParams, from);
  const requestContext = new MiddlewareContext<Record<PropertyKey, unknown>>({
    origin: dappRequest.origin,
    securityAlertResponse: dappRequest.securityAlertResponse,
    traceContext: dappRequest.traceContext,
  });

  const findTransaction = () =>
    getTransactions(messenger).find(
      (tx) =>
        tx.requestId === String(dappRequest.id) &&
        tx.origin === dappRequest.origin,
    );

  const stopWatching = watchQuoteSides(messenger, findTransaction);

  try {
    const hash = await addDappTransaction({
      ...base,
      transactionOptions: {
        type: builtTx.type,
        skipInitialGasEstimate: builtTx.skipInitialGasEstimate,
      },
      dappRequest,
      requestContext,
    });

    return buildMmPayResult({
      hash,
      transactionMeta: findTransaction(),
      sides: stopWatching(),
    });
  } finally {
    stopWatching();
  }
}

function getTransactions(
  messenger: AddTransactionMessenger,
): TransactionMeta[] {
  return (
    messenger.call as unknown as (action: 'TransactionController:getState') => {
      transactions: TransactionMeta[];
    }
  )('TransactionController:getState').transactions;
}

/**
 * Keeps the latest Pay quote sides for the transaction while it's pending.
 * Pay deletes its data when the transaction finalizes, which is before the
 * hash promise resolves, so the snapshot is taken from state changes.
 *
 * @param messenger - Root messenger.
 * @param findTransaction - Returns this request's transaction, once added.
 * @returns A stop function that unsubscribes and returns the last snapshot.
 */
function watchQuoteSides(
  messenger: AddTransactionMessenger,
  findTransaction: () => TransactionMeta | undefined,
): () => MmPayQuoteSides {
  let sides: MmPayQuoteSides = {};
  let active = true;
  const events = messenger as unknown as {
    subscribe: (
      event: 'TransactionPayController:stateChange',
      handler: (state: TransactionPayControllerState) => void,
    ) => void;
    unsubscribe: (
      event: 'TransactionPayController:stateChange',
      handler: (state: TransactionPayControllerState) => void,
    ) => void;
  };

  const handler = (state: TransactionPayControllerState) => {
    const transactionId = findTransaction()?.id;
    const quotes = transactionId
      ? state.transactionData[transactionId]?.quotes
      : undefined;
    if (quotes?.length) {
      sides = getQuoteSides(quotes);
    }
  };

  events.subscribe('TransactionPayController:stateChange', handler);

  return () => {
    if (active) {
      active = false;
      events.unsubscribe('TransactionPayController:stateChange', handler);
    }
    return sides;
  };
}

async function prepare(deps: CommonDeps, rawParams: unknown, from: Hex) {
  const { messenger, securityAlertsEnabled, ensureNetwork } = deps;
  const call = messenger.call as unknown as MmPayMessengerCall;
  const params = validateMmPayParams(rawParams);
  const def = MMPAY_REGISTRY[params.type];

  if (def.isAvailable) {
    const flags =
      call('RemoteFeatureFlagController:getState').remoteFeatureFlags ?? {};
    if (!def.isAvailable(flags as Record<string, unknown>)) {
      throw rpcErrors.methodNotSupported({
        message: `${params.type} is not available`,
      });
    }
  }

  const amountRaw = toAmountRaw(params.amount, def.tokenDecimals);
  const builtTx = def.build({ from, amountRaw });
  const networkClientId = await ensureNetwork(builtTx.chainId);
  const selectedAccount = call('AccountsController:getAccountByAddress', from);

  if (!selectedAccount || !isEvmAccountType(selectedAccount.type)) {
    throw providerErrors.unauthorized({ message: 'EVM account required' });
  }

  const internalAccounts = call('AccountsController:listAccounts');
  const { chainId } = call(
    'NetworkController:getNetworkConfigurationByNetworkClientId',
    networkClientId,
  );

  return {
    base: {
      messenger,
      internalAccounts,
      selectedAccount,
      networkClientId,
      chainId,
      transactionParams: builtTx.txParams,
      securityAlertsEnabled,
    },
    builtTx,
  };
}
