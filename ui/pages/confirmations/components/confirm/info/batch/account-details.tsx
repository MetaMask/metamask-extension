import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { useConfirmContext } from '../../../../context/confirm';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';

export function AccountDetails() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, txParams } = currentConfirmation;
  const { from } = txParams;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Account">
        <ConfirmInfoRowAddress chainId={chainId} address={from} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label="Type">
        <ConfirmInfoRowText text="Smart account" />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
}
