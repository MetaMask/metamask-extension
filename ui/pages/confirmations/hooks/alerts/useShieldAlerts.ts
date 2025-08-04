import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../../context/confirm';
import { getCoverageStatus, type ShieldState } from '../../../../selectors';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const useShieldAlerts = (): Alert[] => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const coverageStatus = useSelector((state) =>
    getCoverageStatus(state as ShieldState, currentConfirmation.id),
  );

  return useMemo(() => {
    switch (coverageStatus) {
      case 'covered':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.covered.reason') || 'Covered reason',
            severity: Severity.Info,
            message: t('shield.covered.message') || 'Covered message',
          },
        ];
      case 'malicious':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.malicious.reason') || 'Malicious reason',
            severity: Severity.Danger,
            message: t('shield.malicious.message') || 'Malicious message',
          },
        ];
      case 'unsupported':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.unsupported.reason') || 'Unsupported reason',
            severity: Severity.Warning,
            message: t('shield.unsupported.message') || 'Unsupported message',
          },
        ];
      default:
        return [];
    }
  }, [coverageStatus, currentConfirmation.id, t]);
};
