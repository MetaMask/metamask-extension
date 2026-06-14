/* eslint-disable @typescript-eslint/naming-convention */
import { Box } from '@metamask/design-system-react';
import React from 'react';

import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useSolanaTransactionData } from '../../../../hooks/transactions/useSolanaTransactionData';
import { useUniversalTransactionDataOptional } from '../../../../hooks/transactions/useUniversalTransactionData';
import { ConfirmLoader } from '../shared/confirm-loader/confirm-loader';
import { SolanaTestCountRow } from './rows/solana-test-count-row';
import { UniversalTransactionFeeRow } from './rows/universal-transaction-fee-row';
import { UniversalTransactionFromRow } from './rows/universal-transaction-from-row';
import { UniversalTransactionHeadingRow } from './rows/universal-transaction-heading-row';
import { UniversalTransactionNetworkRow } from './rows/universal-transaction-network-row';
import { UniversalTransactionToRow } from './rows/universal-transaction-to-row';

function UniversalTransactionInfo() {
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return <ConfirmLoader />;
  }

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
      </ConfirmInfoSection>
      <SolanaSection />
      <ConfirmInfoSection>
        <UniversalTransactionFeeRow />
      </ConfirmInfoSection>
    </>
  );
}

function SolanaSection() {
  const data = useSolanaTransactionData();

  if (!data) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <SolanaTestCountRow />
    </ConfirmInfoSection>
  );
}

export default UniversalTransactionInfo;
