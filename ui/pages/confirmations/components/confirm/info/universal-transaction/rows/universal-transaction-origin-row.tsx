import React from 'react';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useUniversalTransactionDataOptional } from '../../../../../hooks/transactions/useUniversalTransactionData';

export function UniversalTransactionOriginRow() {
  const t = useI18nContext();
  const data = useUniversalTransactionDataOptional();

  if (!data) {
    return null;
  }

  return <ConfirmInfoRow label={t('origin')}>{data.origin}</ConfirmInfoRow>;
}
