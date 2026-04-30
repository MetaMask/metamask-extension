import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../../context/confirm';
import { useTransactionPaySourceAmounts } from '../../../../../hooks/pay/useTransactionPayData';
import { GasFeesDetails } from '../gas-fees-details/gas-fees-details';

export const GasFeesSection = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const sourceAmounts = useTransactionPaySourceAmounts();

  if (!transactionMeta?.txParams) {
    return null;
  }

  if (sourceAmounts?.length) {
    return null;
  }

  return (
    <ConfirmInfoSection data-testid="gas-fee-section">
      <GasFeesDetails />
    </ConfirmInfoSection>
  );
};
