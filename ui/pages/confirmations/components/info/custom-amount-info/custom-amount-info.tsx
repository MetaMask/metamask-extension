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
import { FromAccountRow } from '../../rows/from-account-row';
import { BridgeFeeRow } from '../../rows/bridge-fee-row/bridge-fee-row';
import { BridgeTimeRow } from '../../rows/bridge-time-row/bridge-time-row';
import { TotalRow } from '../../rows/total-row/total-row';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ReceiveRow } from '../../rows/receive-row/receive-row';
import {
  PercentageButtons,
  PercentageButtonsSkeleton,
} from '../../percentage-buttons';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useTransactionCustomAmount } from '../../../hooks/transactions/useTransactionCustomAmount';
import { useTransactionCustomAmountAlerts } from '../../../hooks/transactions/useTransactionCustomAmountAlerts';
import { useAutomaticTransactionPayToken } from '../../../hooks/pay/useAutomaticTransactionPayToken';
import { useTransactionPayPostQuote } from '../../../hooks/pay/useTransactionPayPostQuote';
import { useTransactionPayWithdraw } from '../../../hooks/pay/useTransactionPayWithdraw';
import type { SetPayTokenRequest } from '../../../hooks/pay/types';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayHasExecutableQuote,
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayQuotes,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayMetrics } from '../../../hooks/pay/useTransactionPayMetrics';
import { useTransactionPayAvailableTokens } from '../../../hooks/pay/useTransactionPayAvailableTokens';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { usePayWithNoFeeToken } from '../../../hooks/pay/usePayWithNoFeeToken';
import { useAccountNoFundsAlert } from '../../../hooks/alerts/transactions/useAccountNoFundsAlert';
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
  /**
   * When true, renders a "From account" selector row above the "Pay with" row,
   * letting the user choose which account funds the transaction.
   */
  displayAccountRow?: boolean;
  /**
   * When true, renders the percentage shortcut buttons (10% / 25% / 50% and
   * 90% or Max) under the amount input. Set by the money-account flows; other
   * flows sharing this component keep the plain amount input.
   */
  displayPercentageButtons?: boolean;
  hidePayTokenAmount?: boolean;
  /**
   * When true, pre-fills the amount field with the max balance on load.
   */
  prefillMaxOnLoad?: boolean;
  preferredToken?: SetPayTokenRequest;
  overrideBottomContent?: (hasAmount: boolean) => ReactNode;
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
    displayAccountRow,
    displayPercentageButtons,
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
    // Configures post-quote mode for withdraw flows; no-op for other flows.
    useTransactionPayPostQuote();
    useTransactionPayMetrics();

    const { currentConfirmation } = useConfirmContext<TransactionMeta>();
    const availableTokens = useTransactionPayAvailableTokens();
    const accountNoFundsAlert = useAccountNoFundsAlert();
    const hasAccountNoFunds = accountNoFundsAlert.length > 0;
    // Input enablement keys off the transaction type, not the post-quote flag:
    // withdrawals source funds off-chain (Perps HyperCore, money-account vault)
    // regardless of whether token selection is enabled, so the amount input
    // must stay usable with an empty wallet in both flag states.
    const { isWithdraw } = useTransactionPayWithdraw();
    const hasTokens = availableTokens.length > 0 || isWithdraw;
    const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
    const isAwaitingRequiredToken = !disablePay && !primaryRequiredToken;

    const { disableUpdate } = useTransactionCustomAmountAlerts();

    const {
      amountFiat,
      amountHuman,
      hasAmount,
      hasInput,
      isDepositPrefillLoading,
      updatePendingAmount,
      updatePendingAmountPercentage,
    } = useTransactionCustomAmount({
      balanceUsdOverride,
      currency,
      disableUpdate,
      prefillMaxOnLoad,
    });

    const { isNative: isNativePayToken, payToken } = useTransactionPayToken();
    const { isNoFeeToken } = usePayWithNoFeeToken();
    const isNoFeePayToken = Boolean(
      payToken && isNoFeeToken(payToken.address, String(payToken.chainId)),
    );
    // Withdraw always offers Max. Deposit shows Max only for fixed-spread
    // ("No fee") tokens; other deposit tokens and native deposit tokens keep
    // 90% so a gas/fee buffer remains.
    const showMax = isWithdraw || (isNoFeePayToken && !isNativePayToken);

    const handleAmountChange = useCallback(
      (value: string) => {
        updatePendingAmount(value);
      },
      [updatePendingAmount],
    );

    // Show amount skeleton while deposit prefill recomputes (e.g. token or
    // account change) so the field does not briefly flash "0".
    const showAmountLoader = isDepositPrefillLoading && !hasAccountNoFunds;

    if (!currentConfirmation || isAwaitingRequiredToken) {
      return (
        <CustomAmountInfoSkeleton
          displayPercentageButtons={displayPercentageButtons}
        />
      );
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
          isAmountLoading={showAmountLoader}
          onAmountChange={handleAmountChange}
          overrideCenterContent={overrideCenterContent}
        >
          {children}
        </CenterContainer>
        <AlertMessage />
        {displayPercentageButtons && (
          <PercentageButtons
            disabled={!hasTokens}
            hasMax={showMax}
            onPercentageClick={updatePendingAmountPercentage}
          />
        )}
        {overrideBottomContent?.(hasAmount) ?? (
          <BottomContainer
            amountFiat={amountFiat}
            disablePay={disablePay}
            displayAccountRow={displayAccountRow}
            hasAmount={hasAmount}
          />
        )}
      </Box>
    );
  },
);

export function CustomAmountInfoSkeleton({
  displayPercentageButtons,
}: {
  displayPercentageButtons?: boolean;
} = {}) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1 }}
      data-testid="custom-amount-info-skeleton"
    >
      <CenterContainerSkeleton
        displayPercentageButtons={displayPercentageButtons}
      />
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
  isAmountLoading?: boolean;
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
  isAmountLoading = false,
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
        isLoading={isAmountLoading}
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

function CenterContainerSkeleton({
  displayPercentageButtons,
}: {
  displayPercentageButtons?: boolean;
}) {
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
      {displayPercentageButtons && <PercentageButtonsSkeleton />}
    </Box>
  );
}

function BottomContainer({
  amountFiat,
  disablePay,
  displayAccountRow,
  hasAmount,
}: {
  amountFiat: string;
  disablePay?: boolean;
  displayAccountRow?: boolean;
  hasAmount: boolean;
}) {
  const t = useI18nContext();
  const isResultReady = useIsResultReady(hasAmount);
  const { hideResults } = useTransactionCustomAmountAlerts();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  // Gate the Receive row on the flag, not the transaction type: with post-quote
  // disabled the withdraw falls back to a direct transfer, which has a regular
  // total rather than a bridged "you'll receive" amount. Mirrors mobile
  // `CustomAmountTotals`.
  const { canSelectWithdrawToken } = useTransactionPayWithdraw();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      paddingBottom={4}
    >
      {displayAccountRow && <FromAccountRow showDivider />}
      {/* Keep mounted while funding tokens load after account override so the
          selector does not unmount for the reselect wait, then remount. */}
      {disablePay !== true && <PayWithRow />}
      {isResultReady && !hideResults && (
        <>
          <BridgeFeeRow
            variant={ConfirmInfoRowSize.Small}
            tooltipDescription={
              isPerpsWithdraw ? t('perpsWithdrawTooltip') : undefined
            }
          />
          <BridgeTimeRow rowVariant={ConfirmInfoRowSize.Small} />
          {canSelectWithdrawToken ? (
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

/**
 * Whether the quote-derived rows (transaction fee, estimated time, total /
 * you'll receive) should be shown.
 *
 * These rows are meaningless until the user has entered an amount, so they stay
 * hidden while the field is empty or zero. Gating on `hasAmount` (which tracks
 * the field directly) rather than the quote state also means clearing the
 * amount hides them immediately, instead of leaving the previous quote's
 * numbers on screen until a new quote resolves.
 *
 * @param hasAmount - Whether the amount field holds a value greater than zero.
 */
function useIsResultReady(hasAmount: boolean) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const quotes = useTransactionPayQuotes();
  const isQuotePending = useIsTransactionPayQuotePending();
  const hasExecutableQuote = useTransactionPayHasExecutableQuote();
  const hasPositiveRequiredAmount =
    useTransactionPayHasPositiveRequiredAmount();

  if (!hasAmount) {
    return false;
  }

  if (isPerpsWithdrawTransaction(currentConfirmation)) {
    return hasPositiveRequiredAmount && (isQuotePending || hasExecutableQuote);
  }

  return isQuotePending || Boolean(quotes?.length);
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
