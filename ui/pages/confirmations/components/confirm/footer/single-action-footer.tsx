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
    const firstBlockingAlert = blockingAlerts[0];
    const isLoadingState = isGaslessLoading || isPayLoading;
    let buttonText = t('confirm');

    if (isMusdConversion) {
      buttonText = t('musdConvert');
    }

    if (firstBlockingAlert) {
      return {
        buttonText,
        isDisabled: true,
        isLoading: isLoadingState,
      };
    }

    if (!hasAmount) {
      return {
        buttonText,
        isDisabled: true,
        isLoading: isLoadingState,
      };
    }

    return {
      buttonText,
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
