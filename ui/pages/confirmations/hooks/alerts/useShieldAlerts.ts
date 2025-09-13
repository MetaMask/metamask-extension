import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../../context/confirm';
import { getCoverageStatus, type ShieldState } from '../../../../selectors';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../../../shared/modules/environment';

export const useShieldAlerts = (): Alert[] => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const isShieldEnabled = getIsMetaMaskShieldFeatureEnabled();

  const coverageStatus = useSelector((state) =>
    getCoverageStatus(state as ShieldState, currentConfirmation.id),
  );

  return useMemo(() => {
    if (!isShieldEnabled) {
      return [];
    }
    switch (coverageStatus) {
      case 'covered':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.covered.reason') || 'Shield Status: Covered',
            severity: Severity.Info,
            message:
              t('shield.covered.message') ||
              'This transaction is covered by Shield.',
          },
        ];
      case 'malicious':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.malicious.reason') || 'Shield Status: Malicious',
            severity: Severity.Danger,
            message:
              t('shield.malicious.message') ||
              'This transaction has been flagged as malicious and is not covered by Shield.',
          },
        ];
      case 'unknown':
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason: t('shield.unsupported.reason') || 'Shield Status: Unknown',
            severity: Severity.Warning,
            message:
              t('shield.unsupported.message') ||
              'This transaction has been flagged as unknown and is not covered by Shield.',
          },
        ];
      case undefined:
        return [
          {
            key: `shieldAlert${currentConfirmation.id}`,
            reason:
              t('shield.unsupported.reason') || 'Shield Status: Unavailable',
            severity: Severity.Warning,
            message:
              t('shield.unsupported.message') ||
              'Coverage status is currently unavailable.',
          },
        ];
      default:
        return [];
    }
  }, [coverageStatus, currentConfirmation.id, isShieldEnabled, t]);
};
