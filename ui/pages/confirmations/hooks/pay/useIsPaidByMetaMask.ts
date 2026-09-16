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
 * Whether the confirmation should present fees as paid by MetaMask.
 *
 * For gas-sponsored transactions (`isGasFeeSponsored`), source/target network
 * gas estimates may still be non-zero after quoting even though the user does
 * not pay them. Those fees are ignored; only provider and MetaMask fee
 * components must be zero.
 *
 * Pre-quote (no `sourceAmounts` yet): returns `true` from gas sponsorship
 * alone, before provider/MetaMask fees are known. Callers such as `TotalRow`
 * that strip all fee components when this is true should treat that as
 * "sponsorship claimed for display" rather than proof that every fee line
 * has been quoted as zero.
 *
 * Money-account deposits on Monad are gas-sponsored, and fixed-spread /
 * same-token (Monad mUSD) routes have $0 provider fee, so they show as paid
 * by MetaMask the same way mUSD conversion does. Same-token Money Account
 * withdraws store a Pay no-op quote whose totals still include estimated
 * network gas; that gas is also sponsored on Monad.
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
  const isGasSponsored = Boolean(transactionMeta?.isGasFeeSponsored);

  // Pre-quote / same-token no-op: sponsorship is known from the transaction
  // flag before conversion quotes exist.
  if (isGasSponsored && !sourceAmounts?.length) {
    return true;
  }

  // Every fee is zero before an amount is entered, which is indistinguishable
  // from genuine sponsorship. Requiring a positive amount stops the empty
  // deposit state from claiming "Paid by MetaMask". Withdrawals have no
  // `requiredAssets`, so that gate would never pass.
  if (
    !quotes?.length ||
    !totals?.fees ||
    (!isMoneyAccountWithdraw && !hasPositiveRequiredAmount)
  ) {
    return false;
  }

  const provider = new BigNumber(totals.fees.provider?.usd ?? 0);
  const metaMask = new BigNumber(totals.fees.metaMask?.usd ?? 0);

  if (isGasSponsored) {
    // Sponsored gas estimates can be non-zero; exclude them from the check.
    return provider.isZero() && metaMask.isZero();
  }

  const sourceNetwork = new BigNumber(
    totals.fees.sourceNetwork?.estimate?.usd ?? 0,
  );
  const targetNetwork = new BigNumber(totals.fees.targetNetwork?.usd ?? 0);

  return (
    sourceNetwork.isZero() &&
    targetNetwork.isZero() &&
    provider.isZero() &&
    metaMask.isZero()
  );
}
