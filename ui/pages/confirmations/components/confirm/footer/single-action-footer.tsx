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
import {
  HYPERLIQUID_MIN_DEPOSIT_USDC,
  isHyperliquidDepositConfirmation,
} from '../../../../../../shared/lib/hyperliquid-deposit-transaction';

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
  const requiredTokens = useTransactionPayRequiredTokens();

  const blockingAlerts = useMemo(
    () => alerts.filter((a) => a.isBlocking),
    [alerts],
  );

  const requiredAmountUsd = useMemo(
    () =>
      (requiredTokens ?? [])
        .filter((token) => !token.skipIfBalance)
        .reduce(
          (acc, token) => acc.plus(new BigNumber(token.amountUsd ?? 0)),
          new BigNumber(0),
        ),
    [requiredTokens],
  );
  const hasAmount = requiredAmountUsd.gt(0);

  return useMemo(() => {
    const isLoadingState = isGaslessLoading || isPayLoading;
    const isHyperliquidDeposit =
      isHyperliquidDepositConfirmation(currentConfirmation);
    const defaultButtonText = isHyperliquidDeposit
      ? 'Confirm deposit'
      : t((transactionType && BUTTON_TEXT_BY_TYPE[transactionType]) ?? 'confirm');

    const hasBlockingAlerts = blockingAlerts.length > 0;
    const hyperliquidAmountError =
      isHyperliquidDeposit &&
      hasAmount &&
      requiredAmountUsd.lt(HYPERLIQUID_MIN_DEPOSIT_USDC)
        ? `Minimum ${HYPERLIQUID_MIN_DEPOSIT_USDC} USDC`
        : undefined;
    const isDisabled =
      hasBlockingAlerts || !hasAmount || Boolean(hyperliquidAmountError);

    const firstAlert = blockingAlerts[0];
    const alertText =
      firstAlert?.reason ?? (firstAlert?.message as string | undefined);

    const buttonText =
      (hasBlockingAlerts && alertText) ||
      hyperliquidAmountError ||
      defaultButtonText;

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
    currentConfirmation,
    transactionType,
    requiredAmountUsd,
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
