import { toHex } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import type { MmPayQuoteSides, MmPayResult } from './types';

const RELAY_FALLBACK_HASH = '0x0';

type PayQuoteSnapshot = {
  strategy?: string;
  original?: {
    details?: {
      currencyIn?: { currency?: { chainId?: number } };
      currencyOut?: { currency?: { chainId?: number } };
    };
  };
};

const toOptionalHex = (chainId: number | undefined): Hex | undefined =>
  chainId === undefined ? undefined : toHex(chainId);

/**
 * Reads the provider and both chain IDs from the quote TransactionPayController
 * selected. Call it while the transaction is still pending: Pay deletes its
 * per-transaction data once the transaction finalizes.
 *
 * @param quotes - `TransactionPayController` quotes for the transaction.
 * @returns The quote sides, or an empty object when there is no quote.
 */
export function getQuoteSides(quotes: unknown[] | undefined): MmPayQuoteSides {
  const quote = quotes?.[0] as PayQuoteSnapshot | undefined;
  if (!quote) {
    return {};
  }

  const details = quote.original?.details;

  return {
    provider: quote.strategy,
    sourceChainId: toOptionalHex(details?.currencyIn?.currency?.chainId),
    destinationChainId: toOptionalHex(details?.currencyOut?.currency?.chainId),
  };
}

/**
 * Builds the `wallet_mmPay` result from the confirmed transaction and the Pay
 * quote captured before it finalized.
 *
 * @param args - Inputs.
 * @param args.hash - Hash the transaction resolved with: the provider's
 * destination-side hash when Pay ran a quote.
 * @param args.transactionMeta - The confirmed transaction, if found.
 * @param args.sides - Quote sides captured with {@link getQuoteSides}.
 * @returns The result returned to the dApp.
 */
export function buildMmPayResult({
  hash,
  transactionMeta,
  sides,
}: {
  hash: string | undefined;
  transactionMeta: TransactionMeta | undefined;
  sides: MmPayQuoteSides;
}): MmPayResult {
  const metamaskPay = transactionMeta?.metamaskPay;

  return {
    transactionId: transactionMeta?.id,
    provider: sides.provider ?? metamaskPay?.strategy,
    source: {
      chainId: sides.sourceChainId ?? metamaskPay?.chainId,
      hash: metamaskPay?.sourceHash,
    },
    destination: {
      chainId: sides.destinationChainId,
      hash: hash && hash !== RELAY_FALLBACK_HASH ? (hash as Hex) : undefined,
    },
  };
}
