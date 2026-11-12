import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  getUserPaidNetworkFeeUsd,
  type SponsoredNetworkFeeFlags,
} from './sponsored-network-fees';
import {
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayQuotes,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';

export {
  getUserPaidNetworkFeeUsd,
  type SponsoredNetworkFeeFlags,
} from './sponsored-network-fees';

/**
 * Types that can show "Paid by MetaMask". Perps qualifies only when Money
 * Account is the pay source or destination and every quoted fee is zero.
 */
const SUPPORTED_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
];

const PERPS_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
];

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
    payToken?.chainId &&
    transactionMeta?.chainId &&
    payToken.chainId === transactionMeta.chainId,
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
 * For gas-sponsored transactions (`isGasFeeSponsored`), target-network gas
 * estimates may still be non-zero after quoting even though the user does not
 * pay them. Same-chain source gas is also sponsored (and zeroed by the pay
 * controller); cross-chain source gas is user-paid and must remain in the
 * check. Only provider and MetaMask fee components must be zero for the full
 * "Paid by MetaMask" treatment, plus any user-paid source gas.
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
 *
 * Money Account ↔ Perps shows the label only when Money Account is the pay
 * source (deposit) or destination (withdraw) and the quote's provider,
 * MetaMask, and network fees are all zero. Regular USDC Perps flows stay on
 * the numeric fee. Perps does not use `isGasFeeSponsored`.
 */
export function useIsPaidByMetaMask(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const totals = useTransactionPayTotals();
  const quotes = useTransactionPayQuotes();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();
  const { isSourceNetworkSponsored, isTargetNetworkSponsored } =
    useSponsoredNetworkFeeFlags();
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionMeta?.id ?? ''),
  );

  if (!hasTransactionType(transactionMeta, SUPPORTED_TYPES)) {
    return false;
  }

  const isPerps = hasTransactionType(transactionMeta, PERPS_TYPES);
  // Money Account selection is the payment override, for both funding a Perps
  // deposit and receiving a Perps withdraw. A plain USDC pay token is not it.
  if (isPerps && paymentOverride !== PaymentOverride.MoneyAccount) {
    return false;
  }

  const isMoneyAccountWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.moneyAccountWithdraw,
  ]);

  // Pre-quote / same-token no-op: sponsorship is known from the transaction
  // flag before conversion quotes exist.
  if (isTargetNetworkSponsored && !sourceAmounts?.length) {
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

  if (isTargetNetworkSponsored) {
    // Target gas (and same-chain source gas) can be non-zero while sponsored.
    // Cross-chain source gas is user-paid and blocks the full sponsorship label.
    const userPaidNetwork = getUserPaidNetworkFeeUsd(totals.fees, {
      isSourceNetworkSponsored,
      isTargetNetworkSponsored,
    });
    return provider.isZero() && metaMask.isZero() && userPaidNetwork.isZero();
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
