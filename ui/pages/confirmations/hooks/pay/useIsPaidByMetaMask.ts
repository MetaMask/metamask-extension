import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayQuotes,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';

const SUPPORTED_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
];

/**
 * Determines whether the current transaction is fully sponsored by MetaMask
 * (zero gas, zero provider fee, zero MetaMask fee).
 *
 * The pre-quote sponsored short-circuit is deposit-only. Direct withdrawals
 * set `isGasFeeSponsored` on Monad and never have source amounts, so that
 * check would always show "Paid by MetaMask". Withdrawals only qualify once
 * a quote reports $0 fees.
 */
export function useIsPaidByMetaMask(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const totals = useTransactionPayTotals();
  const quotes = useTransactionPayQuotes();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();

  if (!hasTransactionType(transactionMeta, SUPPORTED_TYPES)) {
    return false;
  }

  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);

  // Pre-quote gasless deposits: no conversion yet, gas is sponsored.
  if (
    !isMoneyAccountWithdraw &&
    transactionMeta?.isGasFeeSponsored &&
    !sourceAmounts?.length
  ) {
    return true;
  }

  // Every fee is zero before an amount is entered, which is indistinguishable
  // from genuine sponsorship. Requiring a positive amount stops the empty state
  // from claiming the transaction is "Paid by MetaMask" and then contradicting
  // itself with real fees once the user types.
  if (!quotes?.length || !totals?.fees || !hasPositiveRequiredAmount) {
    return false;
  }

  const sourceNetwork = new BigNumber(
    totals.fees.sourceNetwork?.estimate?.usd ?? 0,
  );
  const targetNetwork = new BigNumber(totals.fees.targetNetwork?.usd ?? 0);
  const provider = new BigNumber(totals.fees.provider?.usd ?? 0);
  const metaMask = new BigNumber(totals.fees.metaMask?.usd ?? 0);

  return (
    sourceNetwork.isZero() &&
    targetNetwork.isZero() &&
    provider.isZero() &&
    metaMask.isZero()
  );
}
