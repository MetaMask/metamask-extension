import React, { useCallback, useMemo, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  hasTransactionType,
  isPostQuoteWithdrawTransaction,
} from '../../../../../shared/lib/transactions.utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { PayWithModal } from '../../components/modals/pay-with-modal';
import { useMoneyAccountWithdrawableFiat } from '../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';
import { usePayTokenAccountBalance } from './usePayTokenAccountBalance';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

export type PayWithDisplayToken = {
  chainId: string;
  address: string;
  symbol: string;
  balanceUsd: string;
};

type PayWithToken = {
  displayToken: PayWithDisplayToken | undefined;
  balanceUsdFormatted: string;
  label: string;
  from: string | undefined;
  ownerId: string;
  isPostQuoteWithdraw: boolean;
  isMoneyAccountSelected: boolean;
  hasAvailableTokens: boolean;
  openModal: () => void;
  modal: React.ReactNode;
};

/**
 * Resolves the token and interaction state shared by the "Pay with" selector
 * UIs (inline row and centered pill). Owns the pay-token resolution, USD
 * balance formatting, edit permission, and the token-picker modal.
 *
 * @returns The display token, formatted balance, label, edit state, and the
 * rendered picker modal element.
 */
export function usePayWithToken(): PayWithToken {
  const t = useI18nContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { payToken } = useTransactionPayToken();
  const { balanceUsd: accountBalanceUsd } = usePayTokenAccountBalance();
  const requiredTokens = useTransactionPayRequiredTokens();
  const availableTokens = useTransactionPayAvailableTokens();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from;
  const transactionId = currentConfirmation?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isDefaultMoneyAccount = useIsMoneyAccountFlagDefault();
  const isMoneyAccountSelected =
    paymentOverride === PaymentOverride.MoneyAccount ||
    (isDefaultMoneyAccount && !payToken);
  const { withdrawableFiatFormatted } = useMoneyAccountWithdrawableFiat(
    isMoneyAccountSelected,
  );

  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);
  // Avoid flashing the destination/required token (e.g. mUSD on Monad) while
  // payToken is cleared during account switches or initial auto-select.
  // Also wait when Money Account is the flag default so deposits do not flash
  // the required destination token before the override lands.
  const shouldWaitForPayToken =
    isPostQuoteWithdraw ||
    isDefaultMoneyAccount ||
    hasTransactionType(currentConfirmation, [
      TransactionType.moneyAccountDeposit,
    ]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const firstRequiredToken = requiredTokens?.[0];
  const resolvedToken =
    payToken ?? (shouldWaitForPayToken ? undefined : firstRequiredToken);

  const hasAvailableTokens = useMemo(
    () => (availableTokens ?? []).some((token) => !token.disabled),
    [availableTokens],
  );

  // Prefer the live funding-account balance over TransactionPayController's
  // paymentToken snapshot — that snapshot can be 0 / stale (e.g. mUSD on Monad
  // after auto-select) while the Pay-with modal still shows the real balance.
  const cryptoBalanceUsd = payToken
    ? accountBalanceUsd
    : (resolvedToken?.balanceUsd ?? '0');

  const balanceUsdFormatted = useMemo(() => {
    if (isMoneyAccountSelected) {
      return withdrawableFiatFormatted ?? '';
    }
    return fiatFormatter(new BigNumber(cryptoBalanceUsd).toNumber());
  }, [
    cryptoBalanceUsd,
    fiatFormatter,
    isMoneyAccountSelected,
    withdrawableFiatFormatted,
  ]);

  let displayToken: PayWithDisplayToken | undefined;
  if (isMoneyAccountSelected) {
    displayToken = {
      chainId: resolvedToken?.chainId ?? '',
      address: '',
      symbol: t('payWithMoneyAccount'),
      balanceUsd: withdrawableFiatFormatted ?? '',
    };
  } else if (resolvedToken?.chainId) {
    displayToken = {
      chainId: resolvedToken.chainId,
      address: resolvedToken.address,
      symbol: resolvedToken.symbol,
      balanceUsd: cryptoBalanceUsd,
    };
  }

  return {
    displayToken,
    balanceUsdFormatted,
    label: isPostQuoteWithdraw ? t('withdrawTo') : t('payWith'),
    from,
    ownerId: currentConfirmation?.id ?? '',
    isPostQuoteWithdraw,
    isMoneyAccountSelected,
    hasAvailableTokens,
    openModal,
    modal: isModalOpen ? (
      <PayWithModal isOpen={isModalOpen} onClose={closeModal} />
    ) : null,
  };
}
