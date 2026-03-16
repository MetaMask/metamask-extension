import React from 'react';
import { useSelector } from 'react-redux';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { PayWithRow } from '../pay-with-row/pay-with-row';
import { BridgeFeeRow } from '../bridge-fee-row/bridge-fee-row';
import { TotalRow } from '../total-row/total-row';
import { RequiredTokensRow } from '../required-tokens-row';
import { selectIsMetaMaskPayDappsEnabled } from '../../../selectors/feature-flags';

export const TransactionPaySection = () => {
  const requiredTokens = useTransactionPayRequiredTokens();
  const { payToken } = useTransactionPayToken();

  const isPayDappsEnabled = useSelector(selectIsMetaMaskPayDappsEnabled);

  if (!isPayDappsEnabled) {
    return null;
  }

  const hasRequiredTokens = Boolean(requiredTokens?.length);
  const hasPaymentToken = Boolean(payToken);
  const showPayWithRow = hasRequiredTokens;

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
