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

const INSUFFICIENT_BALANCE_ALERTS = new Set([
  AlertsName.InsufficientPayTokenBalance,
  AlertsName.InsufficientPayTokenFees,
  AlertsName.InsufficientPayTokenNative,
]);

function useSingleActionButtonState(isGaslessLoading: boolean): ButtonState {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const isMusdConversion =
    currentConfirmation?.type === TransactionType.musdConversion;

  const { alerts } = useAlerts(transactionId);
  const isPayLoading = useIsTransactionPayLoading();
  const requiredTokens = useTransactionPayRequiredTokens();

  const blockingAlerts = useMemo(
    () => (isMusdConversion ? alerts.filter((a) => a.isBlocking) : []),
    [alerts, isMusdConversion],
  );

  const hasAmount = useMemo(() => {
    if (!isMusdConversion) {
      return false;
    }
    return (requiredTokens ?? [])
      .filter((token) => !token.skipIfBalance)
      .reduce(
        (acc, token) => acc.plus(new BigNumber(token.amountUsd ?? 0)),
        new BigNumber(0),
      )
      .gt(0);
  }, [requiredTokens, isMusdConversion]);

  return useMemo(() => {
    if (!isMusdConversion) {
      return {
        buttonText: t('confirm'),
        isDisabled: false,
        isLoading: isGaslessLoading,
      };
    }

    const firstBlockingAlert = blockingAlerts[0];
    const isLoadingState = isGaslessLoading || isPayLoading;

    if (firstBlockingAlert) {
      return {
        buttonText: INSUFFICIENT_BALANCE_ALERTS.has(firstBlockingAlert.key)
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

    return {
      buttonText: t('musdConvert'),
      isDisabled: false,
      isLoading: isLoadingState,
    };
  }, [
    blockingAlerts,
    hasAmount,
    isGaslessLoading,
    isMusdConversion,
    isPayLoading,
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
