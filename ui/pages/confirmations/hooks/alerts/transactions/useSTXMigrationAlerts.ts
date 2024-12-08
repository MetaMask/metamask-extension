import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { stxAlertIsOpen } from '../../../../../ducks/alerts/stx-migration';
import { AlertActionKey, } from '../../../../../components/app/confirm/info/row/constants';
import { SmartTransactionsAlertMessage } from './SmartTransactionsAlertMessage';

export function useSTXMigrationAlerts(): Alert[] {
  const t = useI18nContext();
  const shouldShow = useSelector(stxAlertIsOpen);

  return useMemo(() => {
    if (!shouldShow) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.OnCloseSmartTransactionsDismissBanner,
            label: t('close'),
          },
        ],
        isBlocking: false,
        key: 'stxMigration',
        message: t('smartTransactionsEnabledMessage'),
        severity: Severity.Info,
        alertDetails: SmartTransactionsAlertMessage(),
      },
    ];
  }, [shouldShow, t]);
}
