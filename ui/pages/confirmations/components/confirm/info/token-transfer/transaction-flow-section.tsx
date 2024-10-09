import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../../context/confirm';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { ConfirmLoader } from '../shared/confirm-loader/confirm-loader';
import { NameOrAddressDisplay } from './name-or-address-display';

export const TransactionFlowSection = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { value, pending } = useDecodedTransactionData();

  const recipientAddress =
    value?.data[0].params.find((param) => param.type === 'address')?.value ||
    '0x0000000000000000000000000000000000000000';

  if (pending) {
    return <ConfirmLoader />;
  }

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        padding={3}
      >
        <NameOrAddressDisplay address={transactionMeta.txParams.from} />
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
        <NameOrAddressDisplay address={recipientAddress} />
      </Box>
    </ConfirmInfoSection>
  );
};
