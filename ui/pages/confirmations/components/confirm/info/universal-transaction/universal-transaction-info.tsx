/* eslint-disable @typescript-eslint/naming-convention */
import { Box } from '@metamask/design-system-react';
import React from 'react';

import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useSolanaTransactionData } from '../../../../hooks/transactions/useSolanaTransactionData';
import { useUniversalTransactionDataOptional } from '../../../../hooks/transactions/useUniversalTransactionData';
import { SolanaTestCountRow } from '../../../rows/solana/solana-test-count-row';
import { UniversalTransactionFeeRow } from '../../../rows/universal/universal-transaction-fee-row';
import { UniversalTransactionFromRow } from '../../../rows/universal/universal-transaction-from-row';
import { UniversalTransactionHeadingRow } from '../../../rows/universal/universal-transaction-heading-row';
import { UniversalTransactionNetworkRow } from '../../../rows/universal/universal-transaction-network-row';
import { UniversalTransactionToRow } from '../../../rows/universal/universal-transaction-to-row';
import { ConfirmLoader } from '../shared/confirm-loader/confirm-loader';

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
      <ConfirmInfoSection>
        <UniversalTransactionFeeRow />
      </ConfirmInfoSection>
      <SolanaSection />
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
