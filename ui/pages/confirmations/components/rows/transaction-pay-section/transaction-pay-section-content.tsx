import React from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowSize } from '../../../../../components/app/confirm/info/row/row';
import { PayWithRow } from '../pay-with-row/pay-with-row';
import { BridgeFeeRow } from '../bridge-fee-row/bridge-fee-row';
import { TotalRow } from '../total-row/total-row';
import { RequiredTokensRow } from '../required-tokens-row/required-tokens-row';

export default function TransactionPaySectionContent({
  hasPaymentToken,
}: {
  hasPaymentToken: boolean;
}) {
  return (
    <ConfirmInfoSection data-testid="transaction-pay-section">
      <RequiredTokensRow />
      <PayWithRow variant={ConfirmInfoRowSize.Default} />
      {hasPaymentToken && (
        <>
          <BridgeFeeRow />
          <TotalRow />
        </>
      )}
    </ConfirmInfoSection>
  );
}
