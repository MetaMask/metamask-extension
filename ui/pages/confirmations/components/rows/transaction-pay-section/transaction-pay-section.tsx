import React from 'react';
import { useSelector } from 'react-redux';
import { mmLazy } from '../../../../../helpers/utils/mm-lazy';
import {
  useIsTransactionPayLoading,
  useTransactionPayRequiredTokens,
} from '../../../hooks/pay/useTransactionPayData';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { selectIsMetaMaskPayDappsEnabled } from '../../../selectors/feature-flags';

const TransactionPaySectionContent = mmLazy(
  () => import('./transaction-pay-section-content'),
);

export const TransactionPaySection = () => {
  const requiredTokens = useTransactionPayRequiredTokens();
  const isLoading = useIsTransactionPayLoading();
  const { payToken } = useTransactionPayToken();

  const isPayDappsEnabled = useSelector(selectIsMetaMaskPayDappsEnabled);

  if (!isPayDappsEnabled) {
    return null;
  }

  const hasRequiredTokens = Boolean(requiredTokens?.length);
  const hasPaymentToken = Boolean(payToken);
  const showPayWithRow = isLoading || hasRequiredTokens;

  if (!showPayWithRow) {
    return null;
  }

  return <TransactionPaySectionContent hasPaymentToken={hasPaymentToken} />;
};
