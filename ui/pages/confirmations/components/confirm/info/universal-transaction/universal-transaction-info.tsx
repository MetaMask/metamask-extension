import { Box } from '@metamask/design-system-react';
import React from 'react';

import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { UniversalTransactionFeeRow } from './rows/universal-transaction-fee-row';
import { UniversalTransactionFromRow } from './rows/universal-transaction-from-row';
import { UniversalTransactionHeadingRow } from './rows/universal-transaction-heading-row';
import { UniversalTransactionNetworkRow } from './rows/universal-transaction-network-row';
import { UniversalTransactionToRow } from './rows/universal-transaction-to-row';

function UniversalTransactionInfo() {
  return (
    <>
      <UniversalTransactionHeadingRow />
      <ConfirmInfoSection>
        <UniversalTransactionFromRow />
        <Box
          style={{ borderTop: '1px solid var(--color-border-muted)' }}
          marginLeft={2}
          marginRight={2}
          marginTop={1}
          marginBottom={1}
        />
        <UniversalTransactionToRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection>
        <UniversalTransactionNetworkRow />
        <UniversalTransactionFeeRow />
      </ConfirmInfoSection>
    </>
  );
}

export default UniversalTransactionInfo;
