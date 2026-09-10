import { isMusdToken } from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { parseApprovalTransactionData } from '../../../shared/lib/transaction.utils';

/**
 * Resolves the raw mUSD amount of a money-account deposit batch. The amount
 * is committed at approval into both the mUSD `requiredAssets` entry and the
 * nested approve calldata; the placeholder contains zero in both locations,
 * so no committed raw amount is available yet. Callers may fall back to the
 * quoted fiat amount.
 *
 * Shared by Money Home activity and the global Activity list so the two
 * surfaces cannot drift.
 *
 * @param transaction - The deposit batch transaction.
 * @param transaction.requiredAssets
 * @param transaction.nestedTransactions
 * @returns Raw mUSD amount in base units, or undefined when not committed.
 */
export function getMoneyAccountDepositAmount(transaction: {
  requiredAssets?: { address: string; amount: string }[];
  nestedTransactions?: { type?: string; data?: string }[];
}): string | undefined {
  const requiredAmount = transaction.requiredAssets?.find(({ address }) =>
    isMusdToken(address),
  )?.amount;
  if (requiredAmount && BigInt(requiredAmount) > 0n) {
    return BigInt(requiredAmount).toString();
  }

  const approve = transaction.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodApprove,
  );
  const approveAmount = approve?.data
    ? parseApprovalTransactionData(
        approve.data as `0x${string}`,
      )?.amountOrTokenId?.toFixed(0)
    : undefined;

  return approveAmount && approveAmount !== '0' ? approveAmount : undefined;
}
