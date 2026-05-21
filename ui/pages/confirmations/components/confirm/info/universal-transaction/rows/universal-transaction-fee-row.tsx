import React from 'react';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';

export function UniversalTransactionFeeRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data || !data.formattedFee) {
    return null;
  }

  return (
    <ConfirmInfoRow label={t('estimatedFee')}>
      {`${data.formattedFee} ${data.assetSymbol}`}
    </ConfirmInfoRow>
  );
}
