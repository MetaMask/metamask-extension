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
 * Watches the request's transaction and captures its Pay quote while pending,
 * since TransactionPayController deletes it before the hash resolves.
 *
 * @param messenger - Root messenger.
 * @param request - Identifies the request's transaction.
 * @param request.origin - The requesting dApp's origin.
 * @param request.requestId - The JSON-RPC request ID.
 * @returns A watcher to stop listening and build the result.
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

/**
 * Reads the provider and both chain IDs from a Pay quote.
 *
 * @param quote - The selected Pay quote.
 * @returns The quote's provider and chains.
 */
export function getQuoteSides(quote: TransactionPayQuote<Json>): QuoteSides {
  return {
    provider: quote.strategy,
    sourceChainId: quote.request?.sourceChainId,
    destinationChainId: quote.request?.targetChainId,
  };
}

/**
 * Builds the result returned to the dApp, omitting unknown fields.
 *
 * @param args - Inputs.
 * @param args.hash - The hash the transaction resolved with.
 * @param args.transactionMeta - The transaction, if found.
 * @param args.sides - Quote sides captured while pending.
 * @returns The `wallet_mmPay` result.
 */
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
