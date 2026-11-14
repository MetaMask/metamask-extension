import { TransactionType } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { getEvmPaymentToken } from '../../../../../shared/lib/transaction/pay-token';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useTransactionPayToken } from './useTransactionPayToken';
import { type SponsoredNetworkFeeFlags } from './sponsored-network-fees';
import {
  useTransactionPayFiatPayment,
  useTransactionPayQuotes,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';

export {
  getUserPaidNetworkFeeUsd,
  type SponsoredNetworkFeeFlags,
} from './sponsored-network-fees';

/**
 * Types whose network gas can be MetaMask-sponsored via `isGasFeeSponsored`.
 * Perps is excluded: its label comes from a zero-fee quote, not gas sponsorship.
 */
const GAS_SPONSORED_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
];

/**
 * Which Transaction Pay network fee legs are MetaMask-sponsored.
 *
 * `isGasFeeSponsored` applies to the parent (e.g. Monad money-account) tx, not
 * every Pay leg. Source gas is only sponsored on same-chain routes.
 *
 * @returns Sponsorship flags for source and target network fee components.
 */
export function useSponsoredNetworkFeeFlags(): SponsoredNetworkFeeFlags {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const { payToken } = useTransactionPayToken();

  const isSupported = hasTransactionType(transactionMeta, GAS_SPONSORED_TYPES);
  const isGasSponsored =
    isSupported && Boolean(transactionMeta?.isGasFeeSponsored);

  const isSameChainPayRoute = Boolean(
    isGasSponsored &&
    transactionMeta?.chainId &&
    getEvmPaymentToken(payToken)?.chainId === transactionMeta.chainId,
  );

  return {
    isTargetNetworkSponsored: isGasSponsored,
    isSourceNetworkSponsored: isSameChainPayRoute,
  };
}

/**
 * Whether any network-fee component is MetaMask-sponsored.
 *
 * Prefer {@link useSponsoredNetworkFeeFlags} when deciding which legs to
 * exclude from totals — source gas on cross-chain routes remains user-paid.
 *
 * @returns Whether the confirmation has sponsored network gas.
 */
export function useIsNetworkFeePaidByMetaMask(): boolean {
  const { isTargetNetworkSponsored } = useSponsoredNetworkFeeFlags();
  return isTargetNetworkSponsored;
}

/**
 * Whether the confirmation should present fees as paid by MetaMask.
 *
 * Matches mobile: any transaction type qualifies. A selected fiat payment
 * method never does. Before source amounts exist, `isGasFeeSponsored` is
 * enough. After that, provider, MetaMask, and both network fees must be zero.
 *
 * @returns Whether the fee row should show "Paid by MetaMask".
 */
export function useIsPaidByMetaMask(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const fiatPayment = useTransactionPayFiatPayment();
  const totals = useTransactionPayTotals();
  const quotes = useTransactionPayQuotes();
  const sourceAmounts = useTransactionPaySourceAmounts();

  if (fiatPayment?.selectedPaymentMethodId) {
    return false;
  }

  // Mirror the fee row's sponsored $0 display (pre-quote, gasless).
  if (transactionMeta?.isGasFeeSponsored && !sourceAmounts?.length) {
    return true;
  }

  if (!quotes?.length || !totals?.fees) {
    return false;
  }

  const sourceNetwork = new BigNumber(
    totals.fees.sourceNetwork?.estimate?.usd ?? 0,
  );
  const targetNetwork = new BigNumber(totals.fees.targetNetwork?.usd ?? 0);
  const provider = new BigNumber(totals.fees.provider?.usd ?? 0);
  const metaMask = new BigNumber(totals.fees.metaMask?.usd ?? 0);

  return (
    sourceNetwork.plus(targetNetwork).isZero() &&
    provider.isZero() &&
    metaMask.isZero()
  );
}
