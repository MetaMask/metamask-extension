import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';

export function useFirstTimeInteractionAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const isFirstTimeInteraction = (currentConfirmation as TransactionMeta)
    ?.firstTimeInteraction;

  return useMemo(() => {
    if (!isFirstTimeInteraction) {
      return [];
    }

    return [
      {
        actions: [],
        field: RowAlertKey.FirstTimeInteraction,
        isBlocking: false,
        key: 'firstTimeInteractionTitle',
        message: t('firstTimeInteractionReason'),
        reason: t('firstTimeInteractionTitle'),
        severity: Severity.Warning,
      },
    ];
  }, [isFirstTimeInteraction, t]);
}
