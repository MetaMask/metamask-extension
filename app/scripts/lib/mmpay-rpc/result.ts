import type { TransactionMeta } from '@metamask/transaction-controller';
import type {
  TransactionPayControllerState,
  TransactionPayQuote,
} from '@metamask/transaction-pay-controller';
import type { Hex, Json } from '@metamask/utils';
import type { MmPayRpcMessenger, MmPayRpcResult } from './types';

// Relay resolves with this placeholder when it has no destination hash.
const RELAY_FALLBACK_HASH = '0x0';

type QuoteSides = {
  provider?: string;
  sourceChainId?: Hex;
  destinationChainId?: Hex;
};

type ResultWatcher = {
  stop: () => void;
  buildResult: (hash: string | undefined) => MmPayRpcResult;
};

/**
 * Tracks the transaction created for a `wallet_mmPay` request and the Pay
 * quote it uses. The quote is captured while the transaction is pending,
 * because TransactionPayController deletes its data once the transaction
 * finalizes, which is before the hash resolves.
 *
 * @param messenger - Root messenger.
 * @param request - Identifies the request's transaction.
 * @param request.origin - The requesting dApp's origin.
 * @param request.requestId - The JSON-RPC request ID.
 * @returns A watcher to stop listening and build the final result.
 */
export function watchMmPayRpcResult(
  messenger: MmPayRpcMessenger,
  { origin, requestId }: { origin: string; requestId: string },
): ResultWatcher {
  let transactionMeta: TransactionMeta | undefined;
  let sides: QuoteSides = {};
  let active = true;

  const onTransactionAdded = (meta: TransactionMeta) => {
    if (meta.origin === origin && meta.requestId === requestId) {
      transactionMeta = meta;
    }
  };

  const onPayStateChange = (state: TransactionPayControllerState) => {
    const quotes = transactionMeta
      ? state.transactionData[transactionMeta.id]?.quotes
      : undefined;

    if (quotes?.length) {
      sides = getQuoteSides(quotes[0]);
    }
  };

  messenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    onTransactionAdded,
  );
  messenger.subscribe('TransactionPayController:stateChange', onPayStateChange);

  const stop = () => {
    if (!active) {
      return;
    }

    active = false;
    messenger.unsubscribe(
      'TransactionController:unapprovedTransactionAdded',
      onTransactionAdded,
    );
    messenger.unsubscribe(
      'TransactionPayController:stateChange',
      onPayStateChange,
    );
  };

  const buildResult = (hash: string | undefined) => {
    const finalMeta = transactionMeta
      ? findTransaction(messenger, transactionMeta.id)
      : undefined;

    return buildMmPayRpcResult({
      hash,
      transactionMeta: finalMeta ?? transactionMeta,
      sides,
    });
  };

  return { stop, buildResult };
}

export function getQuoteSides(quote: TransactionPayQuote<Json>): QuoteSides {
  return {
    provider: quote.strategy,
    sourceChainId: quote.request?.sourceChainId,
    destinationChainId: quote.request?.targetChainId,
  };
}

export function buildMmPayRpcResult({
  hash,
  transactionMeta,
  sides,
}: {
  hash: string | undefined;
  transactionMeta: TransactionMeta | undefined;
  sides: QuoteSides;
}): MmPayRpcResult {
  const metamaskPay = transactionMeta?.metamaskPay;
  const destinationHash =
    hash && hash !== RELAY_FALLBACK_HASH ? (hash as Hex) : undefined;

  return omitUndefined({
    transactionId: transactionMeta?.id,
    provider: sides.provider ?? metamaskPay?.strategy,
    source: omitUndefined({
      chainId: sides.sourceChainId ?? metamaskPay?.chainId,
      hash: metamaskPay?.sourceHash,
    }),
    destination: omitUndefined({
      chainId: sides.destinationChainId,
      hash: destinationHash,
    }),
  });
}

function findTransaction(
  messenger: MmPayRpcMessenger,
  transactionId: string,
): TransactionMeta | undefined {
  return messenger
    .call('TransactionController:getState')
    .transactions.find((tx) => tx.id === transactionId);
}

function omitUndefined<Value extends object>(value: Value): Value {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Value;
}
