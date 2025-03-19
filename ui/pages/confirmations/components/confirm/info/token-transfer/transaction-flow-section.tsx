import { NameType } from '@metamask/name-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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

  const addresses = value?.data[0].params.filter(
    (param) => param.type === 'address',
  );
  const recipientAddress =
    transactionMeta.type === TransactionType.simpleSend
      ? transactionMeta.txParams.to
      : // sometimes there's more than one address, in which case we want the last one
        addresses?.[addresses.length - 1].value;

  if (pending) {
    return <ConfirmLoader />;
  }

  const { chainId } = transactionMeta;

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
          variation={chainId}
        />
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
        {recipientAddress && (
          <Name
            value={recipientAddress}
            type={NameType.ETHEREUM_ADDRESS}
            variation={chainId}
          />
        )}
      </Box>
    </ConfirmInfoSection>
  );
};
