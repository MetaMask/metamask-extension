import React from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { PayWithRow } from '../pay-with-row/pay-with-row';
import { BridgeFeeRow } from '../bridge-fee-row/bridge-fee-row';
import { TotalRow } from '../total-row/total-row';
import { RequiredTokensRow } from '../required-tokens-row';

export const TransactionPaySection = () => {
  const requiredTokens = useTransactionPayRequiredTokens();
  const isLoading = useIsTransactionPayLoading();
  const { payToken } = useTransactionPayToken();

  if (!process.env.MM_PAY_DAPPS_ENABLED) {
    return null;
  }

  const hasRequiredTokens = Boolean(requiredTokens?.length);
  const hasPaymentToken = Boolean(payToken);
  const showPayWithRow = isLoading || hasRequiredTokens;

  if (!showPayWithRow) {
    return null;
  }

  return (
    <ConfirmInfoSection data-testid="transaction-pay-section">
      <RequiredTokensRow />
      <PayWithRow />
      {hasPaymentToken && (
        <>
          <BridgeFeeRow />
          <TotalRow />
        </>
      )}
    </ConfirmInfoSection>
  );
};
