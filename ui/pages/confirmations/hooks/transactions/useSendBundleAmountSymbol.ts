import { TransactionType, type TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatAmount } from '../../components/simulation-details/formatAmount';
import { useTokenValues } from '../../components/confirm/info/hooks/use-token-values';
import { useTokenDetails } from '../../components/confirm/info/hooks/useTokenDetails';

export type SendBundleAmountSymbol = {
  sendAmount?: string;
  sendSymbol?: string;
};

// Safe placeholder so the ERC20 derivation hooks can always run (rules of
// hooks) even when there is no current confirmation or the confirmation is
// not a transaction (e.g. signatures). Matches the shape used internally by
// `useTokenDetails`.
const FALLBACK_TRANSACTION_META = {
  txParams: { to: '', from: '', data: '0x' },
} as TransactionMeta;

/**
 * Derives the display amount and symbol for a hardware-wallet sendBundle
 * transaction, mirroring the send confirmation headings so the HW signing
 * label ("Sending {amount} {symbol}") matches what the user saw on the
 * confirm screen.
 *
 * - Native send (`TransactionType.simpleSend`): amount from `txParams.value`
 * (preferring `txParamsOriginal` so enforced simulations don't zero the
 * displayed amount), formatted via `calcTokenAmount(value, 18)` + `formatAmount`;
 * symbol from the current chain's native currency ticker. This mirrors
 * `NativeSendHeading`.
 * - ERC20 token send (`tokenMethod*`): reuses `useTokenValues` (amount) and
 * `useTokenDetails` (symbol) — the exact derivation used by the ERC20
 * `SendHeading`.
 *
 * Returns empty (`{}`) when there is no transaction confirmation.
 *
 * @param transactionMeta - The send transaction being signed.
 * @returns `sendAmount` / `sendSymbol` (either may be `undefined`).
 */
export function useSendBundleAmountSymbol(
  transactionMeta: TransactionMeta | undefined,
): SendBundleAmountSymbol {
  // Hooks must run unconditionally on every render. Pass a safe fallback when
  // there is no txParams (missing confirmation, or non-transaction types like
  // signatures) so the ERC20 derivation hooks don't throw.
  const hasTxParams = transactionMeta?.txParams !== undefined;
  const safeTransactionMeta = hasTxParams
    ? transactionMeta
    : FALLBACK_TRANSACTION_META;
  const { displayTransferValue } = useTokenValues(safeTransactionMeta);
  const { tokenSymbol } = useTokenDetails(safeTransactionMeta);

  const locale = useSelector(getIntlLocale);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  if (!hasTxParams) {
    return {};
  }

  // Native send: mirror NativeSendHeading.
  if (transactionMeta.type === TransactionType.simpleSend) {
    const { txParams, txParamsOriginal, chainId } = transactionMeta;
    const displayValue = (txParamsOriginal?.value ?? txParams.value) as
      | string
      | undefined;
    const nativeAssetTransferValue = displayValue
      ? calcTokenAmount(displayValue, 18)
      : undefined;
    const nativeCurrency =
      networkConfigurationsByChainId?.[chainId]?.nativeCurrency;

    return {
      sendAmount: nativeAssetTransferValue
        ? formatAmount(locale, nativeAssetTransferValue)
        : undefined,
      sendSymbol: nativeCurrency,
    };
  }

  // ERC20 token send: reuse the exact derivation used by the ERC20 SendHeading.
  return {
    sendAmount: displayTransferValue,
    sendSymbol: tokenSymbol,
  };
}
