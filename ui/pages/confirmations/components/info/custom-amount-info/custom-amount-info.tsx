import React, { ReactNode, useCallback } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
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
import {
  PercentageButtons,
  PercentageButtonsSkeleton,
} from '../../percentage-buttons';
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
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useConfirmContext } from '../../../context/confirm';

/* eslint-disable @typescript-eslint/naming-convention */

export type CustomAmountInfoProps = {
  children?: ReactNode;
  currency?: string;
  disablePay?: boolean;
  hasMax?: boolean;
  preferredToken?: SetPayTokenRequest;
  overrideContent?: (amountHuman: string) => ReactNode;
};

export const CustomAmountInfo: React.FC<CustomAmountInfoProps> = React.memo(
  ({
    children,
    currency,
    disablePay,
    hasMax,
    overrideContent,
    preferredToken,
  }) => {
    useAutomaticTransactionPayToken({
      disable: disablePay,
      preferredToken,
    });
    useTransactionPayMetrics();

    const { currentConfirmation } = useConfirmContext<TransactionMeta>();
    const { isNative: isNativePayToken } = useTransactionPayToken();
    const availableTokens = useTransactionPayAvailableTokens();
    const hasTokens = availableTokens.length > 0;

    const { disableUpdate } = useTransactionCustomAmountAlerts();

    const {
      amountFiat,
      amountHuman,
      updatePendingAmount,
      updatePendingAmountPercentage,
    } = useTransactionCustomAmount({ currency, disableUpdate });

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
          hasMax={hasMax && !isNativePayToken}
          hasTokens={hasTokens}
          onAmountChange={handleAmountChange}
          onPercentageClick={handlePercentageClick}
          overrideContent={overrideContent}
        >
          {children}
        </CenterContainer>
        <BottomContainer />
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
  onAmountChange: (value: string) => void;
  onPercentageClick: (percentage: number) => void;
  overrideContent?: (amountHuman: string) => ReactNode;
};

function CenterContainer({
  amountFiat,
  amountHuman,
  children,
  currency,
  disablePay,
  hasMax,
  hasTokens,
  onAmountChange,
  onPercentageClick,
  overrideContent,
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

      {overrideContent ? (
        overrideContent(amountHuman)
      ) : (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          gap={3}
        >
          {disablePay !== true && (
            <PayTokenAmount amountHuman={amountHuman} disabled={!hasTokens} />
          )}
          {children}
          {disablePay !== true && hasTokens && <PayWithRow />}
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

function BottomContainer() {
  const isResultReady = useIsResultReady();
  const { hideResults } = useTransactionCustomAmountAlerts();

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
      <BridgeFeeRow />
      <BridgeTimeRow />
      <TotalRow />
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
