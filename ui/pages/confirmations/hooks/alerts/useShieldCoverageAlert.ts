import { SignatureRequest } from '@metamask/signature-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CoverageStatus } from '@metamask/shield-controller';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  IconColor,
  Severity,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getCoverageMetrics,
  getCoverageStatus,
  ShieldState,
} from '../../../../selectors/shield/coverage';
import { useConfirmContext } from '../../context/confirm';
import { useEnableShieldCoverageChecks } from '../transactions/useEnableShieldCoverageChecks';
import { IconName } from '../../../../components/component-library';
import { TRANSACTION_SHIELD_ROUTE } from '../../../../helpers/constants/routes';
import { isSignatureTransactionType } from '../../utils';
import { useSignatureEventFragment } from '../useSignatureEventFragment';
import { useTransactionEventFragment } from '../useTransactionEventFragment';
import { ShieldCoverageAlertMessage } from './transactions/ShieldCoverageAlertMessage';

const N_A = 'N/A';

const getModalBodyStr = (reasonCode: string | undefined) => {
  // grouping codes with a fallthrough pattern is not allowed by the linter
  let modalBodyStr: string;
  switch (reasonCode) {
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
      modalBodyStr = 'shieldCoverageAlertMessageUnknown';
      break;
    // Unsupported chain id
    case 'E008':
      modalBodyStr = 'shieldCoverageAlertMessageChainNotSupported';
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
    // Receiver contract malicious
    case 'E301':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Receiver contract risky
    case 'E302':
      modalBodyStr = 'shieldCoverageAlertMessagePotentialRisks';
      break;
    // Transaction type not supported
    case 'E400':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Transaction to not supported
    case 'E401':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
      break;
    // Transaction decoding failed
    case 'E402':
      modalBodyStr = 'shieldCoverageAlertMessageTxTypeNotSupported';
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
    // malicious token receiver contract in swap
    case 'E800':
      modalBodyStr = 'shieldCoverageAlertHighRiskTransaction';
      break;
    // token shows potential malicious behavior
    case 'E801':
      modalBodyStr = 'shieldCoverageAlertMessageTokenTrustSignalWarning';
      break;
    // invalid sentinel result for token check
    case 'E802':
      modalBodyStr = 'shieldCoverageAlertMessageUnknown';
      break;
    // invalid sentinel result
    case 'E803':
      modalBodyStr = 'shieldCoverageAlertMessageUnknown';
      break;
    default:
      modalBodyStr = 'shieldCoverageAlertMessageUnknown';
  }
  return modalBodyStr;
};

const getShieldResult = (
  status?: CoverageStatus | 'not_shown',
): 'covered' | 'not_covered' | 'not_covered_malicious' | 'loading' => {
  switch (status) {
    case 'covered':
      return 'covered';
    case 'malicious':
      return 'not_covered_malicious';
    case 'unknown':
      return 'not_covered';
    default:
      // Returns 'loading' for:
      // - undefined: coverage check not yet initiated or in progress
      // - 'not_shown': coverage didn't load before user confirmed
      // - any unexpected values: fail safe to loading state
      return 'loading';
  }
};

export function useShieldCoverageAlert(): Alert[] {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<
    TransactionMeta | SignatureRequest
  >();

  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const { id } = currentConfirmation ?? {};
  const { reasonCode, status } = useSelector((state) =>
    getCoverageStatus(state as ShieldState, id),
  );
  const metrics = useSelector((state) =>
    getCoverageMetrics(state as ShieldState, id),
  );

  const { isEnabled, isPaused } = useEnableShieldCoverageChecks();

  const isCovered = status === 'covered';
  let modalBodyStr = isCovered
    ? 'shieldCoverageAlertCovered'
    : getModalBodyStr(reasonCode);

  if (isPaused) {
    modalBodyStr = 'shieldCoverageAlertMessagePaused';
  }

  const showAlert =
    (isEnabled && Boolean(status)) ||
    // show paused alert when subscription is paused without coverage status
    isPaused;

  const navigate = useNavigate();
  const onPausedAcknowledgeClick = useCallback(() => {
    navigate(TRANSACTION_SHIELD_ROUTE);
  }, [navigate]);

  // Update metrics only when relevant values change
  useEffect(() => {
    // Only update fragments if shield coverage checks are enabled or paused
    if (isEnabled || isPaused) {
      const properties = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        shield_result: getShieldResult(status),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        shield_reason: modalBodyStr,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        shield_result_response_latency_ms: metrics?.latency ?? N_A,
      };

      if (isSignatureTransactionType(currentConfirmation)) {
        updateSignatureEventFragment({
          properties,
        });
      } else {
        updateTransactionEventFragment(
          {
            properties,
          },
          id,
        );
      }
    }
  }, [
    currentConfirmation,
    id,
    isEnabled,
    isPaused,
    metrics?.latency,
    modalBodyStr,
    status,
    updateSignatureEventFragment,
    updateTransactionEventFragment,
  ]);

  return useMemo<Alert[]>((): Alert[] => {
    if (!showAlert) {
      return [];
    }

    let severity = Severity.Disabled;
    let inlineAlertText = isPaused ? t('shieldPaused') : t('shieldNotCovered');
    const isSignatureRequest = isSignatureTransactionType(currentConfirmation);
    let modalTitle = isPaused
      ? t('shieldCoverageAlertMessageTitlePaused')
      : t('shieldCoverageAlertMessageTitle');
    if (isSignatureRequest && !isPaused) {
      modalTitle = t('shieldCoverageAlertMessageTitleSignatureRequest');
    }
    let inlineAlertTextBackgroundColor;
    let iconColor = IconColor.inherit;
    if (!isPaused) {
      switch (status) {
        case 'covered':
          severity = Severity.Success;
          inlineAlertText = t('shieldCovered');
          iconColor = IconColor.successDefault;
          modalTitle = isSignatureRequest
            ? t('shieldCoverageAlertMessageTitleSignatureRequestCovered')
            : t('shieldCoverageAlertMessageTitleCovered');
          break;
        case 'malicious':
          severity = Severity.Danger;
          inlineAlertTextBackgroundColor = BackgroundColor.errorMuted;
          iconColor = IconColor.errorDefault;
          break;
        default:
      }
    }

    return [
      {
        key: 'shieldCoverageAlert',
        reason: modalTitle,
        field: RowAlertKey.ShieldFooterCoverageIndicator,
        severity,
        content: ShieldCoverageAlertMessage({
          modalBodyStr,
        }),
        isBlocking: false,
        inlineAlertText,
        inlineAlertTextPill: true,
        inlineAlertTextBackgroundColor,
        alertDetailsBackgroundColor: BackgroundColor.backgroundDefault,
        inlineAlertIconRight: true,
        iconName: IconName.Security,
        iconColor,
        showArrow: false,
        isOpenModalOnClick: true,
        hideFromAlertNavigation: true,
        acknowledgeBypass: true,
        customAcknowledgeButtonText: isPaused
          ? t('shieldCoverageAlertMessagePausedAcknowledgeButton')
          : undefined,
        customAcknowledgeButtonOnClick: isPaused
          ? onPausedAcknowledgeClick
          : undefined,
      },
    ];
  }, [
    showAlert,
    isPaused,
    t,
    currentConfirmation,
    modalBodyStr,
    onPausedAcknowledgeClick,
    status,
  ]);
}
