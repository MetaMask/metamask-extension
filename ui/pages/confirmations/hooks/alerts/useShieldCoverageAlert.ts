import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
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

const getModalBodyStr = (reasonCode: string | undefined) => {
  // grouping codes with a fallthrough pattern is not allowed by the linter
  let modalBodyStr: string;
  switch (reasonCode) {
    // Local setup
    case 'E104':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Sender type not supported
    case 'E200':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Receiver type not supported
    case 'E300':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Transaction type not supported
    case 'E400':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Transaction to not supported
    case 'E401':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Malicious domain
    case 'E101':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Risky domain
    case 'E102':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Scan origin error
    case 'E103':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Receiver contract malicious
    case 'E301':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Receiver contract risky
    case 'E302':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Method params contract malicious
    case 'E500':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Method params contract unknown
    case 'E501':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Malicious token contract
    case 'E600':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Risky token contract
    case 'E601':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Invalid blockaid result
    case 'E001':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Invalid sentinel result
    case 'E002':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Malicious blockaid result
    case 'E003':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Unknown blockaid result
    case 'E004':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Malicious sentinel result
    case 'E005':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Invalid coverage result
    case 'E006':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Unknown error
    case 'E007':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Unsupported chain id
    case 'E008':
      modalBodyStr = 'shieldCoverageAlertMessageChainNotSupported';
      break;
    // Signature method not supported
    case 'E700':
      modalBodyStr = 'shieldCoverageAlertMessageSignatureNotSupported';
      break;
    // Signature decoding failed
    case 'E701':
      modalBodyStr = 'shieldCoverageAlertMessageSignatureNotSupported';
      break;
    // SIWE domain not matching
    case 'E702':
      modalBodyStr = 'shieldCoverageAlertMessageSignatureNotSupported';
      break;
    // SIWE account mismatch
    case 'E703':
      modalBodyStr = 'shieldCoverageAlertMessageSignatureNotSupported';
      break;
    default:
      modalBodyStr = 'shieldCoverageAlertMessageUnknown';
  }

  return modalBodyStr;
};

export function useShieldCoverageAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | SignatureRequest
  >();
  const { reasonCode, status } = useSelector((state) =>
    getCoverageStatus(state as ShieldState, currentConfirmation?.id),
  );
  const modalBodyStr = getModalBodyStr(reasonCode);

  const isEnableShieldCoverageChecks = useEnableShieldCoverageChecks();
  const showAlert = isEnableShieldCoverageChecks && Boolean(status);

  return useMemo<Alert[]>((): Alert[] => {
    if (!showAlert) {
      return [];
    }

    let severity = Severity.Info;
    let inlineAlertText = t('shieldNotCovered');
    switch (status) {
      case 'covered':
        severity = Severity.Success;
        inlineAlertText = t('shieldCovered');
        break;
      case 'malicious':
        severity = Severity.Danger;
        break;
      default:
    }

    return [
      {
        key: 'shieldCoverageAlert',
        reason: t('shieldCoverageAlertMessageTitle'),
        field: RowAlertKey.ShieldFooterCoverageIndicator,
        severity,
        content: ShieldCoverageAlertMessage(modalBodyStr),
        isBlocking: false,
        inlineAlertText,
        showArrow: false,
        isOpenModalOnClick: status !== 'covered',
      },
    ];
  }, [status, modalBodyStr, showAlert, t]);
}
