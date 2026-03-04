import type { TransactionMeta } from '@metamask/transaction-controller';
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

const MUSD_MINIMUM_AMOUNT_USD = 10;

type MusdConversionFooterProps = {
  onSubmit: () => void;
  isGaslessLoading: boolean;
};

function useMusdConversionButtonState(isGaslessLoading: boolean) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts } = useAlerts(transactionId);
  const requiredTokens = useTransactionPayRequiredTokens();
  const isLoading = useIsTransactionPayLoading();

  const blockingAlerts = useMemo(
    () => alerts.filter((a) => a.isBlocking),
    [alerts],
  );

  const totalAmountUsd = useMemo(
    () =>
      (requiredTokens ?? [])
        .filter((token) => !token.skipIfBalance)
        .reduce(
          (acc, token) => acc.plus(new BigNumber(token.amountUsd)),
          new BigNumber(0),
        ),
    [requiredTokens],
  );

  return useMemo(() => {
    const firstBlockingAlert = blockingAlerts[0];
    const isLoadingState = isGaslessLoading || isLoading;

    if (firstBlockingAlert) {
      if (firstBlockingAlert.key === AlertsName.InsufficientPayTokenNative) {
        return {
          buttonText: t('musdConvert'),
          isDisabled: true,
          isLoading: isLoadingState,
        };
      }
      return {
        buttonText: t('alertInsufficientPayTokenBalance'),
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

    if (totalAmountUsd.isZero()) {
      return {
        buttonText: t('musdConvert'),
        isDisabled: true,
        isLoading: false,
      };
    }

    if (totalAmountUsd.lt(MUSD_MINIMUM_AMOUNT_USD)) {
      return {
        buttonText: t('musdConvertEnterMinimum', ['$10']),
        isDisabled: true,
        isLoading: false,
      };
    }

    return { buttonText: t('musdConvert'), isDisabled: false, isLoading: false };
  }, [blockingAlerts, isGaslessLoading, isLoading, totalAmountUsd, t]);
}

const MusdConversionFooter = ({
  onSubmit,
  isGaslessLoading,
}: MusdConversionFooterProps) => {
  const { buttonText, isDisabled, isLoading: isButtonLoading } =
    useMusdConversionButtonState(isGaslessLoading);

  return (
    <PageFooter className="confirm-footer_page-footer">
      <Button
        block
        data-testid="confirm-footer-button"
        disabled={!isButtonLoading && isDisabled}
        loading={isButtonLoading}
        onClick={isButtonLoading ? undefined : onSubmit}
        size={ButtonSize.Lg}
      >
        {buttonText}
      </Button>
    </PageFooter>
  );
};

export default MusdConversionFooter;
