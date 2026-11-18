import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import React, { useMemo, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import { Button, ButtonSize } from '@metamask/design-system-react';
import {
  hasTransactionType,
  isPerpsWithdrawTransaction,
} from '../../../../../../shared/lib/transactions.utils';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayHasExecutableQuote,
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useLastMoneyAccountWithdrawAmount } from '../../../hooks/transactions/useLastMoneyAccountWithdrawAmount';
import { getConfirmationTransactionType } from '../../../utils/confirm';
import { FlexDirection } from '../../../../../helpers/constants/design-system';
import { useIsMoneyAccountPerpsNavigation } from '../../../hooks/pay/useIsMoneyAccountPerpsNavigation';

type ButtonState = {
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
};

const BUTTON_TEXT_BY_TYPE: Partial<Record<TransactionType, string>> = {
  [TransactionType.moneyAccountDeposit]: 'addFunds',
  [TransactionType.moneyAccountWithdraw]: 'send',
  [TransactionType.musdConversion]: 'musdConvert',
  [TransactionType.perpsDeposit]: 'addFunds',
  [TransactionType.perpsWithdraw]: 'perpsWithdraw',
};

function useSingleActionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation, isAmountPending } =
    useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const transactionType = getConfirmationTransactionType(currentConfirmation);
  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);
  const isMoneyAccountPerpsDeposit = useIsMoneyAccountPerpsNavigation();
  const { payToken } = useTransactionPayToken();

  const { alerts } = useAlerts(transactionId);
  const isPayLoading = useIsTransactionPayQuotePending();
  const hasExecutableQuote = useTransactionPayHasExecutableQuote();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
  const isMoneyAccountWithdraw =
    transactionType === TransactionType.moneyAccountWithdraw;
  // Same-token mUSD deposits produce a Pay no-op unless `isQuoteRequired` is
  // set. Without an executable quote, confirming skips Pay and never moves
  // funds onto the money account.
  const requiresExecutableQuote =
    isPerpsWithdrawTransaction(currentConfirmation) || isMoneyAccountDeposit;
  const isPayReady = !requiresExecutableQuote || hasExecutableQuote;
  const totals = useTransactionPayTotals();
  const lastWithdrawAmount = useLastMoneyAccountWithdrawAmount(transactionId);

  const blockingAlerts = useMemo(
    () => alerts.filter((a) => a.isBlocking),
    [alerts],
  );

  return useMemo(() => {
    const defaultButtonText = getSingleActionButtonLabel({
      isMoneyAccountDeposit,
      isMoneyAccountPerpsDeposit,
      payTokenSymbol: payToken?.symbol,
      t,
      transactionType,
    });

    // Money-account withdraw batches have no `requiredAssets`, so Pay never
    // resolves a primary required token. Waiting on it leaves Send spinning.
    const isAwaitingRequiredToken =
      !primaryRequiredToken && !isMoneyAccountWithdraw;

    const hasBlockingAlerts = blockingAlerts.length > 0;
    const firstAlert = blockingAlerts[0];
    const alertText =
      firstAlert?.reason ?? (firstAlert?.message as string | undefined);

    // Withdrawals have no `requiredAssets` and often no quote totals (same-
    // token mUSD). Enable from the last typed amount; $0 stays disabled.
    // A typed Pay amount that has not been committed yet keeps the button
    // loading via `isAmountPending`, so confirm cannot submit the previous quote.
    let hasAmount = hasPositivePayAmount(primaryRequiredToken, totals);
    if (isMoneyAccountWithdraw) {
      hasAmount = isPositiveAmount(lastWithdrawAmount);
    }

    const buttonText =
      !isAwaitingRequiredToken && hasBlockingAlerts && alertText
        ? alertText
        : defaultButtonText;

    const isDisabled =
      isAwaitingRequiredToken || hasBlockingAlerts || !hasAmount || !isPayReady;

    // Direct withdraws do not fetch quotes and skip initial gas estimate.
    // Stuck pay/gasless loading flags would keep Send spinning after the
    // amount is already typed.
    const isLoading =
      isAmountPending ||
      isAwaitingRequiredToken ||
      (isGaslessLoading && !isMoneyAccountWithdraw) ||
      (isPayLoading && !(isMoneyAccountWithdraw && !primaryRequiredToken));

    return { buttonText, isDisabled, isLoading };
  }, [
    blockingAlerts,
    isAmountPending,
    isGaslessLoading,
    isMoneyAccountWithdraw,
    isPayReady,
    isPayLoading,
    isMoneyAccountDeposit,
    isMoneyAccountPerpsDeposit,
    lastWithdrawAmount,
    payToken?.symbol,
    primaryRequiredToken,
    totals,
    transactionType,
    t,
  ]);
}

/**
 * Label for the single confirm button.
 * Money deposits name the pay token ("Convert USDC") once Pay has selected
 * one. Until then the generic add-funds label stays, matching mobile.
 *
 * @param options - Transaction type and the selected pay token symbol.
 * @param options.isMoneyAccountDeposit - Whether this confirmation deposits to MetaMask Money.
 * @param options.isMoneyAccountPerpsDeposit - Whether this is a Perps deposit paid from the Money account.
 * @param options.payTokenSymbol - Symbol of the selected pay token, if Pay has one.
 * @param options.t - i18n function.
 * @param options.transactionType - Resolved confirmation transaction type.
 * @returns The confirm button label.
 */
function getSingleActionButtonLabel({
  isMoneyAccountDeposit,
  isMoneyAccountPerpsDeposit,
  payTokenSymbol,
  t,
  transactionType,
}: {
  isMoneyAccountDeposit: boolean;
  isMoneyAccountPerpsDeposit: boolean;
  payTokenSymbol: string | undefined;
  t: ReturnType<typeof useI18nContext>;
  transactionType: TransactionType | undefined;
}): string {
  if (isMoneyAccountPerpsDeposit) {
    return t('send');
  }

  if (isMoneyAccountDeposit && payTokenSymbol) {
    return t('moneyAccountDepositConvert', [payTokenSymbol]);
  }

  const i18nKey =
    (transactionType && BUTTON_TEXT_BY_TYPE[transactionType]) ?? 'confirm';
  return t(i18nKey);
}

function isPositiveAmount(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return new BigNumber(value).gt(0);
}

/**
 * Whether Pay already has a positive amount to enable Confirm.
 * Checks human / raw / USD on the primary required token, then quote totals —
 * deposits and other Pay flows can populate any one of these before the rest.
 * Does not mean an amount was committed or persisted.
 *
 * @param primaryRequiredToken - Primary required token from Pay, if any.
 * @param totals - Pay quote totals, if any.
 * @returns Whether any positive amount field is present.
 */
function hasPositivePayAmount(
  primaryRequiredToken: ReturnType<
    typeof useTransactionPayPrimaryRequiredToken
  >,
  totals: ReturnType<typeof useTransactionPayTotals>,
): boolean {
  if (!primaryRequiredToken) {
    return false;
  }

  if (isPositiveAmount(primaryRequiredToken.amountUsd)) {
    return true;
  }

  if (isPositiveAmount(primaryRequiredToken.amountHuman)) {
    return true;
  }

  if (isPositiveAmount(primaryRequiredToken.amountRaw)) {
    return true;
  }

  return (
    isPositiveAmount(totals?.targetAmount?.usd) ||
    isPositiveAmount(totals?.sourceAmount?.usd)
  );
}

type SingleActionFooterProps = {
  onSubmit: () => void | Promise<void>;
  isGaslessLoading: boolean;
};

export const SingleActionFooter = ({
  onSubmit,
  isGaslessLoading,
}: SingleActionFooterProps) => {
  const { buttonText, isDisabled, isLoading } =
    useSingleActionButtonState(isGaslessLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isDisabled || isLoading || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Confirmation submit failed', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageFooter
      className="confirm-footer_page-footer"
      flexDirection={FlexDirection.Column}
    >
      <Button
        className="w-full"
        data-testid="confirm-footer-button"
        disabled={isDisabled || isLoading || isSubmitting}
        isLoading={isLoading || isSubmitting}
        onClick={handleSubmit}
        size={ButtonSize.Lg}
      >
        {buttonText}
      </Button>
    </PageFooter>
  );
};
