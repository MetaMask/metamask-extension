import React from 'react';

import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useTransactionMetadataRequest } from '../../../../../hooks/useTransactionMetadataRequest';
import { useTransactionPaySourceAmounts } from '../../../../../hooks/pay/useTransactionPayData';
import { GasFeesDetails } from '../gas-fees-details/gas-fees-details';

export const GasFeesSection = () => {
  const transactionMeta = useTransactionMetadataRequest();
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
