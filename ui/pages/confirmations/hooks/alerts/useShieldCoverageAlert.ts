import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { decimalToHex } from '../../../../../shared/modules/conversion.utils';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getCoverageStatus,
  ShieldState,
} from '../../../../selectors/shield/coverage';
import { useConfirmContext } from '../../context/confirm';
import { useEnableShieldCoverageChecks } from '../transactions/useEnableShieldCoverageChecks';
import { ShieldCoverageAlertMessage } from './transactions/ShieldCoverageAlertMessage';

const SUPPORTED_CHAINS = ['1'].map((chainId) => `0x${decimalToHex(chainId)}`);
export const SHIELD_EXCLUDED_TX_TYPES = [
  TransactionType.batch,
  TransactionType.shieldSubscriptionApprove,
  TransactionType.simpleSend,
];

export function useShieldCoverageAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const coverageStatus = useSelector((state) =>
    getCoverageStatus(state as ShieldState, currentConfirmation.id),
  );

  let modalBodyStr = 'shieldCoverageAlertMessageUnknown';
  if (!SUPPORTED_CHAINS.includes(currentConfirmation?.chainId as Hex)) {
    modalBodyStr = 'shieldCoverageAlertMessageChainNotSupported';
  }
  if (coverageStatus === 'malicious') {
    modalBodyStr = 'shieldCoverageAlertMessageMalicious';
  }
  if (
    SHIELD_EXCLUDED_TX_TYPES.includes(
      currentConfirmation.type as TransactionType,
    )
  ) {
    modalBodyStr = 'shieldCoverageAlertMessageTransactionTypeNotSupported';
  } else {
    modalBodyStr = 'shieldCoverageAlertMessageUnknown';
  }

  const isEnableShieldCoverageChecks = useEnableShieldCoverageChecks();

  const showAlert = isEnableShieldCoverageChecks;

  return useMemo<Alert[]>((): Alert[] => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        key: 'shieldCoverageAlert',
        reason: t('shieldCoverageAlertMessageTitle'),
        field: RowAlertKey.ShieldFooterCoverageIndicator,
        severity:
          coverageStatus === 'covered' ? Severity.Success : Severity.Info,
        content: ShieldCoverageAlertMessage(modalBodyStr),
        isBlocking: false,
      },
    ];
  }, [coverageStatus, modalBodyStr, showAlert, t]);
}
