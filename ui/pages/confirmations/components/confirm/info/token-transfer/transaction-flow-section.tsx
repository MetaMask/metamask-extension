import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import Name from '../../../../../../components/app/name';
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

export const TransactionFlowSection = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { value, pending } = useDecodedTransactionData();

  const recipientAddress = value?.data[0].params.find(
    (param) => param.type === 'address',
  )?.value;

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
        <Name
          value={transactionMeta.txParams.from}
          type={NameType.ETHEREUM_ADDRESS}
        />
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
        {recipientAddress && (
          <Name value={recipientAddress} type={NameType.ETHEREUM_ADDRESS} />
        )}
      </Box>
    </ConfirmInfoSection>
  );
};
