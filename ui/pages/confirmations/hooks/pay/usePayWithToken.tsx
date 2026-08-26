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
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { MONEY_ACCOUNT_DUMMY_BALANCE_FIAT } from './sections/usePayWithMoneyAccountSection';

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
  const requiredTokens = useTransactionPayRequiredTokens();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from;
  const transactionId = currentConfirmation?.id ?? '';
  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyAccountSelected =
    paymentOverride === PaymentOverride.MoneyAccount;

  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);
  // Avoid flashing the destination/required token (e.g. mUSD on Monad) while
  // payToken is cleared during account switches or initial auto-select.
  const shouldWaitForPayToken =
    isPostQuoteWithdraw ||
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

  const balanceUsdFormatted = useMemo(() => {
    if (isMoneyAccountSelected) {
      return MONEY_ACCOUNT_DUMMY_BALANCE_FIAT;
    }
    return fiatFormatter(
      new BigNumber(resolvedToken?.balanceUsd ?? '0').toNumber(),
    );
  }, [fiatFormatter, isMoneyAccountSelected, resolvedToken?.balanceUsd]);

  let displayToken: PayWithDisplayToken | undefined;
  if (isMoneyAccountSelected) {
    displayToken = {
      chainId: resolvedToken?.chainId ?? '',
      address: '',
      symbol: t('payWithMoneyAccount'),
      balanceUsd: MONEY_ACCOUNT_DUMMY_BALANCE_FIAT,
    };
  } else if (resolvedToken?.chainId) {
    displayToken = {
      chainId: resolvedToken.chainId,
      address: resolvedToken.address,
      symbol: resolvedToken.symbol,
      balanceUsd: resolvedToken.balanceUsd,
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
    openModal,
    modal: isModalOpen ? (
      <PayWithModal isOpen={isModalOpen} onClose={closeModal} />
    ) : null,
  };
}
