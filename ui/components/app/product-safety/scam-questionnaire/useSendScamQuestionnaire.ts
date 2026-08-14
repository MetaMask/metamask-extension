import { useCallback, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { MetaMetricsEventLocation } from '../../../../../shared/constants/metametrics';
import {
  SCAM_QUESTIONNAIRE_FLAG_KEY,
  SCAM_QUESTIONNAIRE_VARIANTS,
} from '../../../../../shared/lib/ab-testing/configs/scam-questionnaire';
import useAlerts from '../../../../hooks/useAlerts';
import { useABTest } from '../../../../hooks/useABTest';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import type { SecurityAlertResponse } from '../../../../pages/confirmations/types/confirm';
import type { ScamQuestionnaireProps } from './scam-questionnaire';

// Wallet-initiated transfer types (mirrors useConfirmSendNavigation).
const SEND_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];

type OnCancelHandler = (args: {
  location: MetaMetricsEventLocation;
}) => void | Promise<void>;

type UseSendScamQuestionnaireResult = {
  /** True when a Confirm click should open the questionnaire instead of submitting. */
  isScamQuestionnaireRequired: boolean;
  /** Whether the questionnaire modal is currently shown. */
  isScamQuestionnaireVisible: boolean;
  /** Opens the questionnaire modal. */
  showScamQuestionnaire: () => void;
  /** Props to spread onto `<ScamQuestionnaire />`. */
  scamQuestionnaireProps: ScamQuestionnaireProps;
};

/**
 * Encapsulates the send-flow scam questionnaire: eligibility, visibility, and
 * the callbacks that translate questionnaire outcomes into confirmation actions.
 *
 * Completion is tracked via the redux alert-confirmed state
 * (`isAlertConfirmed`) rather than local state — acknowledging the Blockaid
 * alert clears `hasUnconfirmedDangerAlerts`, so the footer proceeds on the next
 * Confirm click while any other danger alerts still surface the alert modal.
 *
 * @param options
 * @param options.ownerId - The confirmation id used to scope alerts.
 * @param options.onCancel - Rejects the confirmation (from `useConfirmActions`).
 */
export function useSendScamQuestionnaire({
  ownerId,
  onCancel,
}: {
  ownerId: string;
  onCancel: OnCancelHandler;
}): UseSendScamQuestionnaireResult {
  // Staged-rollout gate. `trackExposure: false` because this is a rollout,
  // not an experiment — `Experiment Viewed` events are reserved for real
  // A/B tests.
  const { variant } = useABTest(
    SCAM_QUESTIONNAIRE_FLAG_KEY,
    SCAM_QUESTIONNAIRE_VARIANTS,
    undefined,
    { trackExposure: false },
  );

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { alerts, setAlertConfirmed, isAlertConfirmed } = useAlerts(ownerId);
  const [isScamQuestionnaireVisible, setVisible] = useState(false);

  const { origin, type } = currentConfirmation ?? {};
  const securityAlertResponse = currentConfirmation?.securityAlertResponse as
    | SecurityAlertResponse
    | undefined;

  const isMMSend = Boolean(
    origin === ORIGIN_METAMASK && type && SEND_TRANSACTION_TYPES.includes(type),
  );
  const blockaidAlert = alerts.find(
    (alert) => alert.provider === SecurityProvider.Blockaid,
  );

  const isScamQuestionnaireRequired = Boolean(
    variant.showQuestionnaire &&
    isMMSend &&
    securityAlertResponse?.result_type === BlockaidResultType.Malicious &&
    blockaidAlert &&
    !isAlertConfirmed(blockaidAlert.key),
  );

  const showScamQuestionnaire = useCallback(() => {
    setVisible(true);
  }, []);

  const hideScamQuestionnaire = useCallback(() => {
    setVisible(false);
  }, []);

  // Clean pass or bypass: acknowledge the Blockaid alert so the danger gate
  // clears and the next Confirm click submits.
  const onScamComplete = useCallback(() => {
    if (blockaidAlert) {
      setAlertConfirmed(blockaidAlert.key, true);
    }
    setVisible(false);
  }, [blockaidAlert, setAlertConfirmed]);

  // "Stop this payment" on the scam warning rejects the confirmation.
  const onScamReject = useCallback(() => {
    setVisible(false);
    onCancel({ location: MetaMetricsEventLocation.Confirmation });
  }, [onCancel]);

  return {
    isScamQuestionnaireRequired,
    isScamQuestionnaireVisible,
    showScamQuestionnaire,
    scamQuestionnaireProps: {
      onCleanPass: onScamComplete,
      onBypass: onScamComplete,
      onReject: onScamReject,
      onDismiss: hideScamQuestionnaire,
    },
  };
}
