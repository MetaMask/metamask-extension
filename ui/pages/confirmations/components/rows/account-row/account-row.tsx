import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import {
  Icon,
  IconName,
  IconSize,
  Box,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../context/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../components/app/confirm/info/row';

type AccountRowProps = {
  label: string;
  showChevron?: boolean;
};

export const AccountRow = ({ label, showChevron }: AccountRowProps) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  return (
    <ConfirmInfoRow label={label}>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
        <ConfirmInfoRowAddress
          address={transactionMeta.txParams.from}
          chainId={transactionMeta.chainId}
        />
        {showChevron && (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.iconDefault}
          />
        )}
      </Box>
    </ConfirmInfoRow>
  );
};
