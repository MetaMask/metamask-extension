import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import {
  Button,
  ButtonSize,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { AlertsName } from '../../../hooks/alerts/constants';

type ButtonState = {
  buttonText: string;
  isDisabled: boolean;
  isLoading: boolean;
};

function useMusdConversionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts } = useAlerts(transactionId);
  const isLoading = useIsTransactionPayLoading();
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
    const firstBlockingAlert = blockingAlerts[0];
    const isLoadingState = isGaslessLoading || isLoading;

    if (firstBlockingAlert) {
      const isBalanceAlert =
        firstBlockingAlert.key === AlertsName.InsufficientPayTokenBalance ||
        firstBlockingAlert.key === AlertsName.InsufficientPayTokenFees ||
        firstBlockingAlert.key === AlertsName.InsufficientPayTokenNative;

      return {
        buttonText: isBalanceAlert
          ? t('alertInsufficientPayTokenBalance')
          : t('musdConvert'),
        isDisabled: true,
        isLoading: isLoadingState,
      };
    }

    if (!hasAmount) {
      return {
        buttonText: t('musdConvert'),
        isDisabled: true,
        isLoading: isLoadingState,
      };
    }

    if (isLoadingState) {
      return {
        buttonText: t('musdConvert'),
        isDisabled: false,
        isLoading: true,
      };
    }

    return {
      buttonText: t('musdConvert'),
      isDisabled: false,
      isLoading: false,
    };
  }, [blockingAlerts, hasAmount, isGaslessLoading, isLoading, t]);
}

function useSingleActionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const musdState = useMusdConversionButtonState(isGaslessLoading);

  if (currentConfirmation?.type === TransactionType.musdConversion) {
    return musdState;
  }

  return {
    buttonText: t('confirm'),
    isDisabled: false,
    isLoading: isGaslessLoading,
  };
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
    <PageFooter className="confirm-footer_page-footer">
      <Button
        block
        data-testid="confirm-footer-button"
        disabled={!isLoading && isDisabled}
        loading={isLoading}
        onClick={isLoading ? undefined : onSubmit}
        size={ButtonSize.Lg}
      >
        {buttonText}
      </Button>
    </PageFooter>
  );
};
