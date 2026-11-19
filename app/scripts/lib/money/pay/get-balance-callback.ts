import type {
  GetBalanceRequest,
  GetBalanceResponse,
} from '@metamask/transaction-pay-controller';
import {
  getMoneyAccountFlow,
  MoneyAccountFlow,
} from '../../../../../shared/lib/money/money-account-flow';
import { getMaxSourceBalance } from './max-source-balance';

/**
 * Synchronous balance override for max-amount source calculation. Runs inside
 * the TransactionPayController state-update block, so it must resolve
 * synchronously and cannot read UI state or perform RPC.
 *
 * Returns the funding-account balance for money-account deposits, whose max
 * amount cannot be derived from the controller's own pay-token snapshot: the
 * transaction's `from` is the money account, so the snapshot is regularly `0`
 * when Max arms (see max-source-balance). The value is recorded by the UI,
 * which resolves the funding balance reliably.
 *
 * Returns `undefined` for every other case so the controller falls back to the
 * built-in token balance.
 *
 * @param request - The balance request.
 * @param request.transaction - Metadata of the transaction being resolved.
 * @param request.transactionData
 * @returns The balance override, or `undefined` to use the built-in balance.
 */
export function getBalance({
  transaction,
  transactionData,
}: GetBalanceRequest): GetBalanceResponse | undefined {
  if (getMoneyAccountFlow(transaction) !== MoneyAccountFlow.Deposit) {
    return undefined;
  }

  const balanceRaw = getMaxSourceBalance({
    transactionId: transaction.id,
    accountAddress: transactionData.accountOverride,
    chainId: transactionData.paymentToken?.chainId,
    tokenAddress: transactionData.paymentToken?.address,
  });

  return balanceRaw === undefined ? undefined : { balanceRaw };
}
