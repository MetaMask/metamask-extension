/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { isHardwareAccount } from '../../../../multichain-accounts/account-details/account-type-utils';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { PayWithModal } from '../../modals/pay-with-modal';
import { TokenIcon } from '../../token-icon';

export { ConfirmInfoRowSize };

type PayWithRowContentProps = {
  displayToken: {
    chainId: string;
    address: string;
    symbol: string;
    balanceUsd: string;
  };
  canEdit: boolean;
  from: string | undefined;
  onOpenModal: () => void;
  isPerpsWithdraw: boolean;
};

export type PayWithRowProps = {
  variant?: ConfirmInfoRowSize;
};

export const PayWithRowSkeleton = () => {
  return (
    <Box
      data-testid="pay-with-row-skeleton"
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.pill}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={2}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={2}
      paddingRight={4}
    >
      <Skeleton height="32px" width="32px" style={{ borderRadius: '50%' }} />
      <Skeleton height="18px" width="100px" />
      <Skeleton height="18px" width="100px" />
    </Box>
  );
};

export function PayWithRow({
  variant = ConfirmInfoRowSize.Small,
}: PayWithRowProps = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { payToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from;

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, from ?? ''),
  );

  const isArc =
    currentConfirmation?.chainId?.toLowerCase() === CHAIN_IDS.ARC;

  // On Arc, the transaction always pays with the native token — there is no
  // alternative pay-with route, so skip rendering the row entirely.
  if (isArc) {
    return null;
  }

  const canEdit = fromAccount ? !isHardwareAccount(fromAccount) : true;

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const handleOpenModal = useCallback(() => {
    if (canEdit) {
      setIsModalOpen(true);
    }
  }, [canEdit]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const firstRequiredToken = requiredTokens?.[0];
  const displayToken =
    payToken ?? (isPerpsWithdraw ? undefined : firstRequiredToken);

  if (!displayToken?.chainId) {
    if (isPerpsWithdraw) {
      return <PayWithRowSkeleton />;
    }
    return null;
  }

  return (
    <>
      {isModalOpen && (
        <PayWithModal isOpen={isModalOpen} onClose={handleCloseModal} />
      )}
      <PayWithRowInline
        displayToken={{
          chainId: displayToken.chainId,
          address: displayToken.address,
          symbol: displayToken.symbol,
          balanceUsd: displayToken.balanceUsd,
        }}
        canEdit={canEdit}
        from={from}
        onOpenModal={handleOpenModal}
        isPerpsWithdraw={isPerpsWithdraw}
        ownerId={currentConfirmation?.id ?? ''}
        rowVariant={variant}
      />
    </>
  );
}

function PayWithRowInline({
  displayToken,
  canEdit,
  from,
  onOpenModal,
  ownerId,
  isPerpsWithdraw,
  rowVariant,
}: PayWithRowContentProps & {
  ownerId: string;
  rowVariant: ConfirmInfoRowSize;
}) {
  const t = useI18nContext();

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.PayWith}
      ownerId={ownerId}
      data-testid="pay-with-row"
      label={isPerpsWithdraw ? t('withdrawTo') : t('payWith')}
      rowVariant={rowVariant}
    >
      <Box
        data-testid="pay-with-pill"
        onClick={canEdit ? onOpenModal : undefined}
        backgroundColor={
          canEdit
            ? BackgroundColor.backgroundMuted
            : BackgroundColor.transparent
        }
        borderRadius={BorderRadius.pill}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        gap={1}
        style={{
          cursor: canEdit ? 'pointer' : 'default',
          padding: canEdit ? '4px 8px' : '0px',
        }}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          marginRight={1}
        >
          <TokenIcon
            chainId={displayToken.chainId as `0x${string}`}
            tokenAddress={displayToken.address as `0x${string}`}
            symbol={displayToken.symbol}
            size="xs"
          />
        </Box>
        <Text data-testid="pay-with-symbol">{displayToken.symbol}</Text>
        {canEdit && from && (
          <Icon
            data-testid="pay-with-arrow"
            name={IconName.ArrowDown}
            size={IconSize.Sm}
          />
        )}
      </Box>
    </ConfirmInfoAlertRow>
  );
}
