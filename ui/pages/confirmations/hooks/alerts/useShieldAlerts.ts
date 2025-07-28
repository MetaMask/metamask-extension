import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../../context/confirm';
import { getCoverageStatus, type ShieldState } from '../../../../selectors';
import { useSelector } from 'react-redux';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TransactionMeta } from '@metamask/transaction-controller';

const isTransactionMeta = (confirmation: unknown): confirmation is TransactionMeta => {
  throw new Error('Not implemented');
};

export const useShieldAlerts = (): Alert[] => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  if (!isTransactionMeta(currentConfirmation)) {
    return [];
  }

  const coverageStatus = useSelector((state) => getCoverageStatus(state as ShieldState, currentConfirmation.id));
  if (!coverageStatus) {
    return [];
  }

  switch (coverageStatus) {
    case 'covered':
      return [
        {
          key: `shieldAlert${currentConfirmation.id}`,
          reason: t('shield.covered.reason'),
          severity: Severity.Info,
          message: t('shield.covered.message'),
        },
      ];
    case 'malicious':
      return [{
        key: `shieldAlert${currentConfirmation.id}`,
        reason: t('shield.malicious.reason'),
        severity: Severity.Danger,
        message: t('shield.malicious.message'),
      }];
    case 'unsupported':
      return [
        {
          key: `shieldAlert${currentConfirmation.id}`,
          reason: t('shield.unsupported.reason'),
          severity: Severity.Warning,
          message: t('shield.unsupported.message'),
        },
      ];
  }
};
