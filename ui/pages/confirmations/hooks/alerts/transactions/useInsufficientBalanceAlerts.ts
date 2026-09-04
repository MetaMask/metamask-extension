import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getNativeTokenCachedBalanceByChainIdSelector,
  getUseTransactionSimulations,
} from '../../../../../selectors';
import { hasMonadReserveBalanceViolation } from '../../../../../../shared/lib/monad-reserve-balance';
import { sumHexes } from '../../../../../../shared/lib/conversion.utils';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';
import { useHasInsufficientBalance } from '../../useHasInsufficientBalance';
import { useTransactionPayHasSourceAmount } from '../../pay/useTransactionPayHasSourceAmount';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { useTransactionPayWithdraw } from '../../pay/useTransactionPayWithdraw';

const ZERO_HEX_FALLBACK = '0x0';

export function useInsufficientBalanceAlerts({
  ignoreGasFeeToken,
}: {
  ignoreGasFeeToken?: boolean;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    selectedGasFeeToken,
    gasFeeTokens,
    excludeNativeTokenForFee,
    chainId,
    simulationData,
    simulationFails,
    txParams: { value = ZERO_HEX_FALLBACK, from: fromAddress = '' } = {},
  } = currentConfirmation ?? {};
  // Post-quote withdraw flows don't use the user's native balance for gas the
  // same way as standard txs, so suppress the "insufficient balance" alert
  // even when native balance is low. Gate on the post-quote flag rather than
  // the transaction type: with post-quote disabled the withdraw falls back to
  // a direct transfer, which does spend native balance on gas.
  const { canSelectWithdrawToken: isPostQuoteWithdraw } =
    useTransactionPayWithdraw();
  const { hasInsufficientBalance, isNativeBalanceKnown, nativeCurrency } =
    useHasInsufficientBalance();
  const isSimulationEnabled = useSelector(getUseTransactionSimulations);
  const isSponsored = currentConfirmation?.isGasFeeSponsored;
  const {
    isSupported: isGaslessSupported,
    pending: isGaslessSupportedPending,
  } = useIsGaslessSupported();

  const isUsingPay = useTransactionPayHasSourceAmount();
  const { payToken } = useTransactionPayToken();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const isPayPendingInput =
    Boolean(payToken) && primaryRequiredToken?.amountRaw === '0';

  // Money-account batches execute from the money account, which has no native
  // MON. Gas is sponsored, so the EOA native-balance check is wrong. Direct
  // withdraws also skip initial gas estimate, so this alert otherwise blocks
  // Send after the user types an amount.
  const isMoneyAccountTransaction = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
    TransactionType.moneyAccountWithdraw,
  ]);

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const chainBalances = useSelector((state) =>
    getNativeTokenCachedBalanceByChainIdSelector(state, fromAddress ?? ''),
  ) as Record<Hex, Hex>;

  const balance =
    chainId && Object.hasOwn(chainBalances ?? {}, chainId)
      ? (chainBalances?.[chainId as Hex] ?? ZERO_HEX_FALLBACK)
      : undefined;

  // Prefer the Monad reserve-balance alert over the generic "pay for network
  // fees" message when the protocol reserve (not max-fee solvency) is the cause.
  const hasMonadReserveViolation = hasMonadReserveBalanceViolation({
    chainId,
    balance,
    value: sumHexes(value, ...batchTransactionValues),
    simulationData,
    simulationFails,
  });

  const isGasFeeTokensEmpty = gasFeeTokens?.length === 0;

  // Check if gasless check has completed (regardless of result)
  const isGaslessCheckComplete = !isGaslessSupportedPending;

  // Transaction is sponsored only if it's marked as sponsored AND gasless is supported
  const isSponsoredTransaction = isSponsored && isGaslessSupported;

  // Simulation is complete if it's disabled, or if enabled and gasFeeTokens is loaded
  const isSimulationComplete = !isSimulationEnabled || Boolean(gasFeeTokens);

  // Check if user has selected a gas fee token (or we're ignoring that check)
  // Note: In the case of chains with no native token (ex: Tempo), `selectedGasFeeToken`
  // may be populated despite no gas token being available.
  // For those chains, `excludeNativeTokenForFee` will always be `true`, hence we can
  // rely on the combination of `excludeNativeTokenForFee` and `isGasFeeTokensEmpty`.
  const hasNoGasFeeTokenSelected =
    ignoreGasFeeToken ||
    !selectedGasFeeToken ||
    (excludeNativeTokenForFee && isGasFeeTokensEmpty);

  // Gasless check is complete AND one of:
  //  - Gasless is NOT supported (native currency needed for gas)
  //  - Gasless IS supported but no alternative gas fee tokens are available
  //  - Gas fee tokens are available but none is selected
  const shouldCheckGaslessConditions =
    isGaslessCheckComplete &&
    (!isGaslessSupported ||
      isGasFeeTokensEmpty ||
      (!isGasFeeTokensEmpty && !selectedGasFeeToken));

  const showAlert =
    hasInsufficientBalance &&
    isNativeBalanceKnown &&
    !isUsingPay &&
    !isPayPendingInput &&
    isSimulationComplete &&
    hasNoGasFeeTokenSelected &&
    shouldCheckGaslessConditions &&
    !isSponsoredTransaction &&
    !isPostQuoteWithdraw &&
    !isMoneyAccountTransaction &&
    !hasMonadReserveViolation;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuyWithNativeCurrency', [nativeCurrency]),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('alertMessageInsufficientBalanceWithNativeCurrency', [
          nativeCurrency,
        ]),
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [nativeCurrency, showAlert, t]);
}
