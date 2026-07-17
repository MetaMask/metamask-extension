import React, { useCallback, useMemo, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { isPerpsWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getInternalAccountByAddress } from '../../../../selectors/accounts';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { isHardwareAccount } from '../../../multichain-accounts/account-details/account-type-utils';
import { useConfirmContext } from '../../context/confirm';
import { PayWithModal } from '../../components/modals/pay-with-modal';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';

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
  canEdit: boolean;
  from: string | undefined;
  ownerId: string;
  isPerpsWithdraw: boolean;
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

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, from ?? ''),
  );

  const canEdit = fromAccount ? !isHardwareAccount(fromAccount) : true;
  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const openModal = useCallback(() => {
    if (canEdit) {
      setIsModalOpen(true);
    }
  }, [canEdit]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const firstRequiredToken = requiredTokens?.[0];
  const resolvedToken =
    payToken ?? (isPerpsWithdraw ? undefined : firstRequiredToken);

  const balanceUsdFormatted = useMemo(
    () =>
      fiatFormatter(new BigNumber(resolvedToken?.balanceUsd ?? '0').toNumber()),
    [fiatFormatter, resolvedToken?.balanceUsd],
  );

  const displayToken = resolvedToken?.chainId
    ? {
        chainId: resolvedToken.chainId,
        address: resolvedToken.address,
        symbol: resolvedToken.symbol,
        balanceUsd: resolvedToken.balanceUsd,
      }
    : undefined;

  return {
    displayToken,
    balanceUsdFormatted,
    label: isPerpsWithdraw ? t('withdrawTo') : t('payWith'),
    canEdit,
    from,
    ownerId: currentConfirmation?.id ?? '',
    isPerpsWithdraw,
    openModal,
    modal: isModalOpen ? (
      <PayWithModal isOpen={isModalOpen} onClose={closeModal} />
    ) : null,
  };
}
