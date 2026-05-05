import React, { ReactNode, useCallback } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  CustomAmount,
  CustomAmountSkeleton,
} from '../../transactions/custom-amount/custom-amount';
import {
  PayTokenAmount,
  PayTokenAmountSkeleton,
} from '../../pay-token-amount/pay-token-amount';
import {
  PayWithRow,
  PayWithRowSkeleton,
} from '../../rows/pay-with-row/pay-with-row';
import { BridgeFeeRow } from '../../rows/bridge-fee-row/bridge-fee-row';
import { BridgeTimeRow } from '../../rows/bridge-time-row/bridge-time-row';
import { TotalRow } from '../../rows/total-row/total-row';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import {
  PercentageButtons,
  PercentageButtonsSkeleton,
} from '../../percentage-buttons';
import { ReceiveRow } from '../../rows/receive-row/receive-row';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useTransactionCustomAmount } from '../../../hooks/transactions/useTransactionCustomAmount';
import { useTransactionCustomAmountAlerts } from '../../../hooks/transactions/useTransactionCustomAmountAlerts';
import { useAutomaticTransactionPayToken } from '../../../hooks/pay/useAutomaticTransactionPayToken';
import type { SetPayTokenRequest } from '../../../hooks/pay/types';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayMetrics } from '../../../hooks/pay/useTransactionPayMetrics';
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

/* eslint-disable @typescript-eslint/naming-convention */

export type CustomAmountInfoProps = {
  /**
   * Optional caller-provided balance (USD) used as the source for the
   * percentage buttons. Takes precedence over the default `payToken.balanceUsd`.
   * Used by flows (e.g. Perps Withdraw) whose balance comes from a different
   * source than the selected pay token.
   */
  balanceUsdOverride?: number;
  children?: ReactNode;
  currency?: string;
  /**
   * When true, it prevents automatic selection of payment token based on balance and feature flags
   */
  disableAutomaticToken?: boolean;
  /**
   * When true, it disables MetaMask Pay for transactions that just need custom amount input
   */
  disablePay?: boolean;
  hasMax?: boolean;
  hidePayTokenAmount?: boolean;
  preferredToken?: SetPayTokenRequest;
  overrideBottomContent?: ReactNode;
  overrideCenterContent?: (amountHuman: string) => ReactNode;
};

export const CustomAmountInfo: React.FC<CustomAmountInfoProps> = React.memo(
  ({
    balanceUsdOverride,
    children,
    currency,
    disableAutomaticToken,
    disablePay,
    hasMax,
    hidePayTokenAmount,
    overrideBottomContent,
    overrideCenterContent,
    preferredToken,
  }) => {
    useAutomaticTransactionPayToken({
      disable: Boolean(disablePay) || Boolean(disableAutomaticToken),
      preferredToken,
    });
    useTransactionPayMetrics();

    const { currentConfirmation } = useConfirmContext<TransactionMeta>();
    const availableTokens = useTransactionPayAvailableTokens();
    const hasTokens = availableTokens.length > 0;

    const { disableUpdate } = useTransactionCustomAmountAlerts();

    const {
      amountFiat,
      amountHuman,
      updatePendingAmount,
      updatePendingAmountPercentage,
    } = useTransactionCustomAmount({
      balanceUsdOverride,
      currency,
      disableUpdate,
    });

    const handleAmountChange = useCallback(
      (value: string) => {
        updatePendingAmount(value);
      },
      [updatePendingAmount],
    );

    const handlePercentageClick = useCallback(
      (percentage: number) => {
        updatePendingAmountPercentage(percentage);
      },
      [updatePendingAmountPercentage],
    );

    if (!currentConfirmation) {
      return <CustomAmountInfoSkeleton />;
    }

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ flex: 1 }}
        data-testid="custom-amount-info"
      >
        <CenterContainer
          amountFiat={amountFiat}
          amountHuman={amountHuman}
          currency={currency}
          disablePay={disablePay}
          hasMax={hasMax}
          hasTokens={hasTokens}
          hidePayTokenAmount={hidePayTokenAmount}
          onAmountChange={handleAmountChange}
          onPercentageClick={handlePercentageClick}
          overrideCenterContent={overrideCenterContent}
        >
          {children}
        </CenterContainer>
        {overrideBottomContent ?? <BottomContainer amountFiat={amountFiat} />}
      </Box>
    );
  },
);

export function CustomAmountInfoSkeleton() {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1 }}
      data-testid="custom-amount-info-skeleton"
    >
      <CenterContainerSkeleton />
    </Box>
  );
}

type CenterContainerProps = {
  amountFiat: string;
  amountHuman: string;
  children?: ReactNode;
  currency?: string;
  disablePay?: boolean;
  hasMax?: boolean;
  hasTokens: boolean;
  hidePayTokenAmount?: boolean;
  onAmountChange: (value: string) => void;
  onPercentageClick: (percentage: number) => void;
  overrideCenterContent?: (amountHuman: string) => ReactNode;
};

function CenterContainer({
  amountFiat,
  amountHuman,
  children,
  currency,
  disablePay,
  hasMax,
  hasTokens,
  hidePayTokenAmount,
  onAmountChange,
  onPercentageClick,
  overrideCenterContent,
}: CenterContainerProps) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={4}
      style={{ flex: 1 }}
    >
      <CustomAmount
        amountFiat={amountFiat}
        currency={currency}
        disabled={!hasTokens}
        onChange={onAmountChange}
      />

      {overrideCenterContent ? (
        overrideCenterContent(amountHuman)
      ) : (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          gap={3}
        >
          {disablePay !== true && !hidePayTokenAmount && (
            <PayTokenAmount amountHuman={amountHuman} disabled={!hasTokens} />
          )}
          {children}
          {disablePay !== true && hasTokens && (
            <PayWithRow variant={ConfirmInfoRowSize.Small} />
          )}
        </Box>
      )}

      {hasTokens && hasMax && (
        <PercentageButtons onPercentageClick={onPercentageClick} />
      )}
      <AlertMessage />
    </Box>
  );
}

function CenterContainerSkeleton() {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={4}
      style={{ flex: 1 }}
    >
      <CustomAmountSkeleton />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={2}
      >
        <PayTokenAmountSkeleton />
        <PayWithRowSkeleton />
      </Box>
      <PercentageButtonsSkeleton />
    </Box>
  );
}

function BottomContainer({ amountFiat }: { amountFiat: string }) {
  const t = useI18nContext();
  const isResultReady = useIsResultReady();
  const { hideResults } = useTransactionCustomAmountAlerts();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  if (!isResultReady || hideResults) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      paddingBottom={4}
    >
      <BridgeFeeRow
        variant={ConfirmInfoRowSize.Small}
        tooltipDescription={
          isPerpsWithdraw ? t('perpsWithdrawTooltip') : undefined
        }
      />
      <BridgeTimeRow rowVariant={ConfirmInfoRowSize.Small} />
      {isPerpsWithdraw ? (
        <ReceiveRow
          inputAmountUsd={amountFiat}
          variant={ConfirmInfoRowSize.Small}
        />
      ) : (
        <TotalRow variant={ConfirmInfoRowSize.Small} />
      )}
    </Box>
  );
}

function useIsResultReady() {
  const quotes = useTransactionPayQuotes();
  const isQuotesLoading = useIsTransactionPayLoading();

  return isQuotesLoading || Boolean(quotes?.length);
}

function AlertMessage() {
  const { alertMessage } = useTransactionCustomAmountAlerts();

  if (!alertMessage) {
    return null;
  }

  return (
    <Text
      variant={TextVariant.bodySm}
      color={TextColor.errorDefault}
      textAlign={TextAlign.Center}
    >
      {alertMessage}
    </Text>
  );
}
