import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { Button, ButtonSize } from '@metamask/design-system-react';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import {
  useIsTransactionPayLoading,
  useTransactionPayPrimaryRequiredToken,
} from '../../../hooks/pay/useTransactionPayData';
import { FlexDirection } from '../../../../../helpers/constants/design-system';

type ButtonState = {
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
};

const BUTTON_TEXT_BY_TYPE: Partial<Record<TransactionType, string>> = {
  [TransactionType.musdConversion]: 'musdConvert',
  [TransactionType.perpsDeposit]: 'addFunds',
  [TransactionType.perpsWithdraw]: 'perpsWithdraw',
};

function useSingleActionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const transactionType = currentConfirmation?.type;

  const { alerts } = useAlerts(transactionId);
  const isPayLoading = useIsTransactionPayLoading();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();

  const blockingAlerts = useMemo(
    () => alerts.filter((a) => a.isBlocking),
    [alerts],
  );

  return useMemo(() => {
    const i18nKey =
      (transactionType && BUTTON_TEXT_BY_TYPE[transactionType]) ?? 'confirm';
    const defaultButtonText = t(i18nKey);

    const isAwaitingRequiredToken = !primaryRequiredToken;

    const hasBlockingAlerts = blockingAlerts.length > 0;
    const firstAlert = blockingAlerts[0];
    const alertText =
      firstAlert?.reason ?? (firstAlert?.message as string | undefined);

    const hasAmount = primaryRequiredToken
      ? new BigNumber(primaryRequiredToken.amountUsd ?? 0).gt(0)
      : false;

    const buttonText =
      !isAwaitingRequiredToken && hasBlockingAlerts && alertText
        ? alertText
        : defaultButtonText;

    const isDisabled =
      isAwaitingRequiredToken || hasBlockingAlerts || !hasAmount;

    const isLoading =
      isAwaitingRequiredToken || isGaslessLoading || isPayLoading;

    return { buttonText, isDisabled, isLoading };
  }, [
    blockingAlerts,
    isGaslessLoading,
    isPayLoading,
    primaryRequiredToken,
    transactionType,
    t,
  ]);
}

type SingleActionFooterProps = {
  onSubmit: () => void;
  isGaslessLoading: boolean;
};

export const SingleActionFooter = ({
  onSubmit,
  isGaslessLoading,
}: SingleActionFooterProps) => {
  const { buttonText, isDisabled, isLoading } =
    useSingleActionButtonState(isGaslessLoading);

  return (
    <PageFooter
      className="confirm-footer_page-footer"
      flexDirection={FlexDirection.Column}
    >
      <Button
        className="w-full"
        data-testid="confirm-footer-button"
        disabled={isDisabled}
        isLoading={isLoading}
        onClick={isLoading ? undefined : onSubmit}
        size={ButtonSize.Lg}
      >
        {buttonText}
      </Button>
    </PageFooter>
  );
};
