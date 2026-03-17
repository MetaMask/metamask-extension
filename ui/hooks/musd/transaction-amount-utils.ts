import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { parseStandardTokenTransactionData } from '../../../shared/lib/transaction.utils';

/**
 * Extract the transfer/claim amount from a transaction as a decimal string.
 *
 * Tries to parse `txParams.data` as a standard token transfer and reads
 * `args._value` (the ERC-20 amount). Falls back to `txParams.value` for
 * native-token transfers. Returns `undefined` when neither source yields
 * an amount.
 *
 * @param tx - The transaction metadata to extract from.
 * @returns The amount as a base-10 decimal string, or `undefined`.
 */
export function extractTransactionAmount(
  tx: TransactionMeta,
): string | undefined {
  const txData = tx.txParams?.data;
  if (txData) {
    try {
      const parsedData = parseStandardTokenTransactionData(txData);
      const amountValue = parsedData?.args?._value;
      if (amountValue) {
        return new BigNumber(amountValue.toString()).toString(10);
      }
    } catch (e) {
      console.error('Failed to parse amount from transaction data:', e);
    }
  }

  if (tx.txParams?.value) {
    try {
      return new BigNumber(tx.txParams.value).toString(10);
    } catch (e) {
      console.error('Failed to parse amount from txParams.value:', e);
    }
  }

  return undefined;
}
