import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getShouldShowFiat } from '../../../../selectors';
import { useBalanceChanges } from '../../components/simulation-details/useBalanceChanges';
import { calculateTotalFiat } from '../../components/simulation-details/fiat-display';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

/**
 * Above this USD value the formatted amount is suppressed and copy falls back
 * to the word "funds", to avoid alarming users with implausible simulated
 * totals (per PSAFE-509 product decision).
 */
export const SENDING_ASSETS_FIAT_DISPLAY_CEILING_USD = 10_000_000;

/**
 * Returns the formatted fiat total of assets leaving the user's wallet
 * according to transaction simulation, for use in security alert copy
 * ("If you continue, your $1,234.56 can't be recovered.").
 *
 * Returns null when no amount should be displayed: signatures and other
 * confirmations without simulation data, zero/unavailable fiat or USD
 * conversion, fiat display disabled, simulation still loading, or totals above
 * the display ceiling. Callers fall back to amount-less copy.
 */
export function useSendingAssetsFiatTotal(): string | null {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const shouldShowFiat = useSelector(getShouldShowFiat);
  const fiatFormatter = useFiatFormatter();

  const chainId = transactionMeta?.chainId as Hex;
  const simulationData = transactionMeta?.simulationData;

  const { pending, value: balanceChanges } = useBalanceChanges({
    chainId,
    simulationData,
  });

  if (!shouldShowFiat || pending || !simulationData || simulationData.error) {
    return null;
  }

  const sendingAssets = balanceChanges.filter((change) =>
    change.amount.isNegative(),
  );

  if (sendingAssets.length === 0) {
    return null;
  }

  const totalFiat = Math.abs(
    calculateTotalFiat(sendingAssets.map((change) => change.fiatAmount)),
  );
  const totalUsd = Math.abs(
    calculateTotalFiat(sendingAssets.map((change) => change.usdAmount)),
  );

  // The ceiling is denominated in USD, and unavailable conversions total to
  // zero, so a zero USD total means the amount cannot be checked against the
  // ceiling rather than meaning the amount is small.
  if (
    totalFiat === 0 ||
    totalUsd === 0 ||
    totalUsd > SENDING_ASSETS_FIAT_DISPLAY_CEILING_USD
  ) {
    return null;
  }

  return fiatFormatter(totalFiat);
}
