'use no memo';

import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type {
  TransactionPaymentToken,
  TransactionPayRequiredToken,
} from '@metamask/transaction-pay-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsPostQuote,
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
} from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';

function isSameToken(
  payToken: TransactionPaymentToken,
  requiredToken: TransactionPayRequiredToken,
): boolean {
  return (
    payToken.address.toLowerCase() === requiredToken.address.toLowerCase() &&
    payToken.chainId.toLowerCase() === requiredToken.chainId.toLowerCase()
  );
}

function hasSufficientRawBalance(
  payToken: TransactionPaymentToken,
  requiredToken: TransactionPayRequiredToken,
): boolean {
  return new BigNumber(payToken.balanceRaw ?? '0').gte(
    requiredToken.amountRaw ?? '0',
  );
}

export function useNoPayTokenQuotesAlert(): Alert[] {
  const t = useI18nContext();
  const { payToken } = useTransactionPayToken();
  const quotes = useTransactionPayQuotes();
  const isQuotesLoading = useIsTransactionPayLoading();
  const isPostQuote = useTransactionPayIsPostQuote();
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  const isOptionalOnly =
    !isPostQuote &&
    (sourceAmounts ?? []).every(
      (sourceAmount) =>
        requiredTokens?.find(
          (rt) => rt.address === sourceAmount.targetTokenAddress,
        )?.skipIfBalance,
    );

  const nonOptionalRequiredTokens = (requiredTokens ?? []).filter(
    (requiredToken) => !requiredToken.skipIfBalance,
  );

  const isDirectPayment =
    !isPostQuote &&
    payToken !== undefined &&
    nonOptionalRequiredTokens.length > 0 &&
    nonOptionalRequiredTokens.every(
      (requiredToken) =>
        isSameToken(payToken, requiredToken) &&
        hasSufficientRawBalance(payToken, requiredToken),
    );

  const showAlert =
    payToken &&
    !isQuotesLoading &&
    sourceAmounts?.length &&
    !quotes?.length &&
    !isOptionalOnly &&
    !isDirectPayment;

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message: t('alertNoPayTokenQuotesMessage'),
        reason: t('alertNoPayTokenQuotesTitle'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [showAlert, t]);
}
