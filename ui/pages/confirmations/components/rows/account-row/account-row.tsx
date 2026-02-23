import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useConfirmContext } from '../../../context/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
} from '../../../../../components/app/confirm/info/row';

type AccountRowProps = {
  label: string;
};

export const AccountRow = ({ label }: AccountRowProps) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  return (
    <ConfirmInfoRow label={label}>
      <ConfirmInfoRowAddress
        address={transactionMeta.txParams.from}
        chainId={transactionMeta.chainId}
      />
    </ConfirmInfoRow>
  );
};
