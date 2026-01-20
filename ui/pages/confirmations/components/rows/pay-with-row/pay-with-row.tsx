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
import { PayWithModal } from '../../modals/pay-with-modal';
import {
  GasFeeTokenIcon,
  GasFeeTokenIconSize,
} from '../../confirm/info/shared/gas-fee-token-icon';

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

export const PayWithRow = () => {
  const t = useI18nContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { payToken } = useTransactionPayToken();
  const fiatFormatter = useFiatFormatter();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const from = currentConfirmation?.txParams?.from;

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, from ?? ''),
  );

  const canEdit = fromAccount ? !isHardwareAccount(fromAccount) : true;

  const handleClick = useCallback(() => {
    if (!canEdit) {
      return;
    }
    setIsModalOpen(true);
  }, [canEdit]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const balanceUsdFormatted = useMemo(
    () => fiatFormatter(new BigNumber(payToken?.balanceUsd ?? '0').toNumber()),
    [fiatFormatter, payToken?.balanceUsd],
  );

  if (!payToken) {
    return <PayWithRowSkeleton />;
  }

  return (
    <>
      {isModalOpen && (
        <PayWithModal isOpen={isModalOpen} onClose={handleClose} />
      )}
      <Box
        data-testid="pay-with-row"
        onClick={handleClick}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.pill}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        gap={3}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={2}
        paddingRight={4}
        style={{
          cursor: canEdit ? 'pointer' : 'default',
        }}
      >
        <GasFeeTokenIcon
          tokenAddress={payToken.address}
          size={GasFeeTokenIconSize.Md}
        />
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          data-testid="pay-with-symbol"
        >
          {`${t('payWith')} ${payToken.symbol}`}
        </Text>
        <Text
          variant={TextVariant.bodyMdMedium}
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
    </>
  );
};
