import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  stxAlertIsOpen,
  dismissAndDisableAlert,
} from '../../../../../ducks/alerts/stx-migration';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';

export function useSTXMigrationAlerts(): Alert[] {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const shouldShow = useSelector(stxAlertIsOpen);

  return useMemo(() => {
    if (!shouldShow) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: 'learnMore',
            label: t('learnMoreUpperCase'),
            onClick: () => {
              window.open(ZENDESK_URLS.SMART_TRANSACTIONS_LEARN_MORE, '_blank');
              dispatch(dismissAndDisableAlert());
            },
          },
        ],
        field: RowAlertKey.FirstTimeInteraction,
        isBlocking: false,
        key: 'stxMigration',
        message: t('smartTransactionsEnabledMessage'),
        severity: Severity.Warning,
      },
    ];
  }, [shouldShow, t, dispatch]);
}
