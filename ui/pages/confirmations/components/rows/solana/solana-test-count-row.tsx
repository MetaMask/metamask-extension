import React from 'react';

import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row/row';
import { useSolanaTransactionData } from '../../../hooks/transactions/useSolanaTransactionData';

export function SolanaTestCountRow() {
  const data = useSolanaTransactionData();
  const count = data?.custom?.count;

  if (count === undefined) {
    return null;
  }

  return (
    <ConfirmInfoRow label="Solana test count">
      {String(count)}
    </ConfirmInfoRow>
  );
}
