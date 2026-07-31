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
import { PayWithRow } from '../../rows/pay-with-row/pay-with-row';
import { BridgeFeeRow } from '../../rows/bridge-fee-row/bridge-fee-row';
import { BridgeTimeRow } from '../../rows/bridge-time-row/bridge-time-row';
import { TotalRow } from '../../rows/total-row/total-row';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ReceiveRow } from '../../rows/receive-row/receive-row';
import {
  isPerpsWithdrawTransaction,
  isPostQuoteWithdrawTransaction,
} from '../../../../../../shared/lib/transactions.utils';
import { useTransactionCustomAmount } from '../../../hooks/transactions/useTransactionCustomAmount';
import { useTransactionCustomAmountAlerts } from '../../../hooks/transactions/useTransactionCustomAmountAlerts';
import { useAutomaticTransactionPayToken } from '../../../hooks/pay/useAutomaticTransactionPayToken';
import type { SetPayTokenRequest } from '../../../hooks/pay/types';
import {
  useIsTransactionPayLoading,
  useTransactionPayPrimaryRequiredToken,
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
  /**
   * When true, focuses the input on mount and selects the value so typing replaces it
   */
  autoFocusAmount?: boolean;
  currency?: string;
  /**
   * When true, it prevents automatic selection of payment token based on balance and feature flags
   */
  disableAutomaticToken?: boolean;
  /**
   * When true, it disables MetaMask Pay for transactions that just need custom amount input
   */
  disablePay?: boolean;
  hidePayTokenAmount?: boolean;
  /**
   * When true, pre-fills the amount field with the max balance on load.
   */
  prefillMaxOnLoad?: boolean;
  preferredToken?: SetPayTokenRequest;
  overrideBottomContent?: (hasInput: boolean) => ReactNode;
  overrideCenterContent?: (amountHuman: string, hasInput: boolean) => ReactNode;
};

export const CustomAmountInfo = React.memo(
  ({
    balanceUsdOverride,
    children,
    autoFocusAmount = false,
    currency,
    disableAutomaticToken,
    disablePay,
    hidePayTokenAmount,
    overrideBottomContent,
    overrideCenterContent,
    prefillMaxOnLoad,
    preferredToken,
  }: CustomAmountInfoProps) => {
    useAutomaticTransactionPayToken({
      disable: Boolean(disablePay) || Boolean(disableAutomaticToken),
      preferredToken,
    });
    useTransactionPayMetrics();

    const { currentConfirmation } = useConfirmContext<TransactionMeta>();
    const availableTokens = useTransactionPayAvailableTokens();
    const isPostQuoteWithdraw =
      isPostQuoteWithdrawTransaction(currentConfirmation);
    // Post-quote withdrawals (e.g. Perps) source funds off-chain, not from a
    // wallet token, so the amount input stays usable without wallet tokens.
    const hasTokens = availableTokens.length > 0 || isPostQuoteWithdraw;
    const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
    const isAwaitingRequiredToken = !disablePay && !primaryRequiredToken;

    const { disableUpdate } = useTransactionCustomAmountAlerts();

    const { amountFiat, amountHuman, hasInput, updatePendingAmount } =
      useTransactionCustomAmount({
        balanceUsdOverride,
        currency,
        disableUpdate,
        prefillMaxOnLoad,
      });

    const handleAmountChange = useCallback(
      (value: string) => {
        updatePendingAmount(value);
      },
      [updatePendingAmount],
    );

    if (!currentConfirmation || isAwaitingRequiredToken) {
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
          autoFocusAmount={autoFocusAmount}
          amountFiat={amountFiat}
          amountHuman={amountHuman}
          currency={currency}
          disablePay={disablePay}
          hasInput={hasInput}
          hasTokens={hasTokens}
          hidePayTokenAmount={hidePayTokenAmount}
          onAmountChange={handleAmountChange}
          overrideCenterContent={overrideCenterContent}
        >
          {children}
        </CenterContainer>
        <AlertMessage />
        {overrideBottomContent?.(hasInput) ?? (
          <BottomContainer
            amountFiat={amountFiat}
            disablePay={disablePay}
            hasTokens={hasTokens}
          />
        )}
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
  autoFocusAmount: boolean;
  amountFiat: string;
  amountHuman: string;
  children?: ReactNode;
  currency?: string;
  disablePay?: boolean;
  hasInput: boolean;
  hasTokens: boolean;
  hidePayTokenAmount?: boolean;
  onAmountChange: (value: string) => void;
  overrideCenterContent?: (amountHuman: string, hasInput: boolean) => ReactNode;
};

function CenterContainer({
  autoFocusAmount,
  amountFiat,
  amountHuman,
  children,
  currency,
  disablePay,
  hasInput,
  hasTokens,
  hidePayTokenAmount,
  onAmountChange,
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
        autoFocus={autoFocusAmount}
        currency={currency}
        disabled={!hasTokens}
        onChange={onAmountChange}
      />

      {overrideCenterContent ? (
        overrideCenterContent(amountHuman, hasInput)
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
        </Box>
      )}
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
      <PayTokenAmountSkeleton />
    </Box>
  );
}

function BottomContainer({
  amountFiat,
  disablePay,
  hasTokens,
}: {
  amountFiat: string;
  disablePay?: boolean;
  hasTokens: boolean;
}) {
  const t = useI18nContext();
  const isResultReady = useIsResultReady();
  const { hideResults } = useTransactionCustomAmountAlerts();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      paddingBottom={4}
    >
      {disablePay !== true && hasTokens && <PayWithRow />}
      {isResultReady && !hideResults && (
        <>
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
        </>
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
