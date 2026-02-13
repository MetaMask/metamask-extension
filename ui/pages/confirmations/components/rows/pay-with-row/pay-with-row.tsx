/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useMemo, useState } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
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
};

type PayWithRowSmallProps = PayWithRowContentProps & {
  balanceUsdFormatted: string;
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
  variant = ConfirmInfoRowSize.Default,
}: PayWithRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { payToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const fiatFormatter = useFiatFormatter();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from;

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, from ?? ''),
  );

  const canEdit = fromAccount ? !isHardwareAccount(fromAccount) : true;

  const handleOpenModal = useCallback(() => {
    if (canEdit) {
      setIsModalOpen(true);
    }
  }, [canEdit]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const firstRequiredToken = requiredTokens?.[0];
  const displayToken = payToken ?? firstRequiredToken;

  const balanceUsdFormatted = useMemo(
    () =>
      fiatFormatter(new BigNumber(displayToken?.balanceUsd ?? '0').toNumber()),
    [fiatFormatter, displayToken?.balanceUsd],
  );

  if (!displayToken?.chainId) {
    return null;
  }

  const contentProps: PayWithRowContentProps = {
    displayToken: {
      chainId: displayToken.chainId,
      address: displayToken.address,
      symbol: displayToken.symbol,
      balanceUsd: displayToken.balanceUsd,
    },
    canEdit,
    from,
    onOpenModal: handleOpenModal,
  };

  const isSmall = variant === ConfirmInfoRowSize.Small;

  return (
    <>
      {isModalOpen && (
        <PayWithModal isOpen={isModalOpen} onClose={handleCloseModal} />
      )}
      {isSmall ? (
        <PayWithRowSmall
          {...contentProps}
          balanceUsdFormatted={balanceUsdFormatted}
        />
      ) : (
        <PayWithRowDefault
          {...contentProps}
          ownerId={currentConfirmation?.id ?? ''}
        />
      )}
    </>
  );
}

function PayWithRowSmall({
  displayToken,
  balanceUsdFormatted,
  canEdit,
  from,
  onOpenModal,
}: PayWithRowSmallProps) {
  const t = useI18nContext();

  return (
    <ConfirmInfoRow
      data-testid="pay-with-row"
      label={t('payWith')}
      rowVariant={ConfirmInfoRowSize.Small}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
        onClick={canEdit ? onOpenModal : undefined}
        style={{ cursor: canEdit ? 'pointer' : 'default' }}
      >
        <TokenIcon
          chainId={displayToken.chainId as `0x${string}`}
          tokenAddress={displayToken.address as `0x${string}`}
          size="sm"
        />
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textDefault}
          data-testid="pay-with-symbol"
        >
          {displayToken.symbol}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          data-testid="pay-with-balance"
        >
          {balanceUsdFormatted}
        </Text>
        {canEdit && from && (
          <Icon
            name={IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.iconAlternative}
          />
        )}
      </Box>
    </ConfirmInfoRow>
  );
}

function PayWithRowDefault({
  displayToken,
  canEdit,
  from,
  onOpenModal,
  ownerId,
}: PayWithRowContentProps & { ownerId: string }) {
  const t = useI18nContext();

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.PayWith}
      ownerId={ownerId}
      data-testid="pay-with-row"
      label={t('payWith')}
      rowVariant={ConfirmInfoRowSize.Default}
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
