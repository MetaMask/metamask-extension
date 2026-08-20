import { BigNumber } from 'bignumber.js';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import {
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayTotals,
} from './useTransactionPayData';

const SUPPORTED_TYPES: TransactionType[] = [TransactionType.musdConversion];

/**
 * Determines whether the current transaction is fully sponsored by MetaMask
 * (zero gas, zero provider fee, zero MetaMask fee).
 *
 * Scoped to musdConversion for now; broadening to other types is a product
 * decision left for follow-up.
 */
export function useIsPaidByMetaMask(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const totals = useTransactionPayTotals();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();

  // Every fee is zero before an amount is entered, which is indistinguishable
  // from genuine sponsorship. Requiring a positive amount stops the empty state
  // from claiming the transaction is "Paid by MetaMask" and then contradicting
  // itself with real fees once the user types.
  if (
    !hasTransactionType(transactionMeta, SUPPORTED_TYPES) ||
    !totals?.fees ||
    !hasPositiveRequiredAmount
  ) {
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
