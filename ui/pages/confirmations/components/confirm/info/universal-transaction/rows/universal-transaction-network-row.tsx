import React from 'react';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';

const NETWORK_LABEL_BY_NAMESPACE: Record<string, string> = {
  solana: 'Solana',
};

export function UniversalTransactionNetworkRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  const networkLabel =
    NETWORK_LABEL_BY_NAMESPACE[data.chainNamespace] ?? data.chain;

  return (
    <ConfirmInfoRow label={t('transactionFlowNetwork')}>
      {networkLabel}
    </ConfirmInfoRow>
  );
}
