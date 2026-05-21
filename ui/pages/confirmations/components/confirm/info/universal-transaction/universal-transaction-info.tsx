import React from 'react';

import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { UniversalTransactionFeeRow } from './rows/universal-transaction-fee-row';
import { UniversalTransactionFromRow } from './rows/universal-transaction-from-row';
import { UniversalTransactionHeadingRow } from './rows/universal-transaction-heading-row';
import { UniversalTransactionNetworkRow } from './rows/universal-transaction-network-row';
import { UniversalTransactionOriginRow } from './rows/universal-transaction-origin-row';
import { UniversalTransactionToRow } from './rows/universal-transaction-to-row';

function UniversalTransactionInfo() {
  return (
    <>
      <UniversalTransactionHeadingRow />
      <ConfirmInfoSection>
        <UniversalTransactionNetworkRow />
        <UniversalTransactionOriginRow />
        <UniversalTransactionFromRow />
        <UniversalTransactionToRow />
        <UniversalTransactionFeeRow />
      </ConfirmInfoSection>
    </>
  );
}

export default UniversalTransactionInfo;
