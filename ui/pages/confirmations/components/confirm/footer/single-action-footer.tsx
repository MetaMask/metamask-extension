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
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { FlexDirection } from '../../../../../helpers/constants/design-system';

type ButtonState = {
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
};

const BUTTON_TEXT_BY_TYPE: Partial<Record<TransactionType, string>> = {
  [TransactionType.musdConversion]: 'musdConvert',
};

function useSingleActionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const transactionType = currentConfirmation?.type;

  const { alerts } = useAlerts(transactionId);
  const isPayLoading = useIsTransactionPayLoading();
  const requiredTokens = useTransactionPayRequiredTokens();

  const blockingAlerts = useMemo(
    () => alerts.filter((a) => a.isBlocking),
    [alerts],
  );

  const hasAmount = useMemo(
    () =>
      (requiredTokens ?? [])
        .filter((token) => !token.skipIfBalance)
        .reduce(
          (acc, token) => acc.plus(new BigNumber(token.amountUsd ?? 0)),
          new BigNumber(0),
        )
        .gt(0),
    [requiredTokens],
  );

  return useMemo(() => {
    const isLoadingState = isGaslessLoading || isPayLoading;
    const i18nKey =
      (transactionType && BUTTON_TEXT_BY_TYPE[transactionType]) ?? 'confirm';
    const buttonText = t(i18nKey);

    const isDisabled = blockingAlerts.length > 0 || !hasAmount;

    return {
      buttonText,
      isDisabled,
      isLoading: isLoadingState,
    };
  }, [
    blockingAlerts,
    hasAmount,
    isGaslessLoading,
    isPayLoading,
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
        isLoading={isLoading && !isDisabled}
        onClick={isLoading ? undefined : onSubmit}
        size={ButtonSize.Lg}
      >
        {buttonText}
      </Button>
    </PageFooter>
  );
};
