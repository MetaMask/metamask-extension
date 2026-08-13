import { useCallback, useEffect, useState } from 'react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
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
import { getRemoteFeatureFlags } from '../../../../../shared/lib/selectors/remote-feature-flags';
import useAlerts from '../../../../hooks/useAlerts';
import { useABTest } from '../../../../hooks/useABTest';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import type { SecurityAlertResponse } from '../../../../pages/confirmations/types/confirm';
import type { ScamQuestionnaireProps } from './scam-questionnaire';
import { ScamQuestionnaireTrigger } from './scam-questionnaire.constants';

const SEND_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];

type OnCancelHandler = (args: {
  location: MetaMetricsEventLocation;
}) => void | Promise<void>;

export type UseScamQuestionnaireResult = {
  isScamQuestionnaireRequired: boolean;
  isScamQuestionnaireVisible: boolean;
  showScamQuestionnaire: () => void;
  scamQuestionnaireProps: ScamQuestionnaireProps;
};

function matchesScamDomain(origin: string, domain: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

type SendBranchResult = {
  required: boolean;
  securityAlert: { key: string } | undefined;
};

function checkSendBranch({
  variant,
  currentConfirmation,
  alerts,
  isAlertConfirmed,
}: {
  variant: { showQuestionnaire: boolean };
  currentConfirmation: TransactionMeta | undefined;
  alerts: { key: string; provider?: SecurityProvider }[];
  isAlertConfirmed: (key: string) => boolean;
}): SendBranchResult {
  const { origin, type } = currentConfirmation ?? {};
  const securityAlertResponse = currentConfirmation?.securityAlertResponse as
    | SecurityAlertResponse
    | undefined;
  const isMMSend = Boolean(
    origin === ORIGIN_METAMASK && type && SEND_TRANSACTION_TYPES.includes(type),
  );
  const securityAlert = alerts.find(
    (alert) => alert.provider === SecurityProvider.Blockaid,
  );
  const required = Boolean(
    variant.showQuestionnaire &&
    isMMSend &&
    securityAlertResponse?.result_type === BlockaidResultType.Malicious &&
    securityAlert &&
    !isAlertConfirmed(securityAlert.key),
  );
  return { required, securityAlert };
}

function checkDomainBranch({
  currentConfirmation,
  remoteFlags,
  hasPassed,
}: {
  currentConfirmation: TransactionMeta | undefined;
  remoteFlags: Record<string, unknown>;
  hasPassed: boolean;
}): boolean {
  const flagValue = remoteFlags[SCAM_QUESTIONNAIRE_FLAG_KEY] as
    | { name?: string; value?: string[] }
    | undefined;
  const scamDomains = flagValue?.value ?? [];
  const { origin } = currentConfirmation ?? {};
  const isDappInitiated = Boolean(origin && origin !== ORIGIN_METAMASK);
  return (
    isDappInitiated &&
    scamDomains.some((domain) => matchesScamDomain(origin as string, domain)) &&
    !hasPassed
  );
}

export function useScamQuestionnaire({
  ownerId,
  onCancel,
}: {
  ownerId: string;
  onCancel: OnCancelHandler;
}): UseScamQuestionnaireResult {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const [isScamQuestionnaireVisible, setVisible] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  useEffect(() => {
    setHasPassed(false);
    setVisible(false);
  }, [currentConfirmation?.id]);

  // Send-flow branch
  const { variant } = useABTest(
    SCAM_QUESTIONNAIRE_FLAG_KEY,
    SCAM_QUESTIONNAIRE_VARIANTS,
    undefined,
    { trackExposure: false },
  );
  const { alerts, setAlertConfirmed, isAlertConfirmed } = useAlerts(ownerId);
  const { required: isSendBranchRequired, securityAlert } = checkSendBranch({
    variant,
    currentConfirmation,
    alerts,
    isAlertConfirmed,
  });

  // Domain-list branch
  const remoteFlags = useSelector(getRemoteFeatureFlags);
  const isDomainBranchRequired = checkDomainBranch({
    currentConfirmation,
    remoteFlags: remoteFlags as Record<string, unknown>,
    hasPassed,
  });

  const isScamQuestionnaireRequired =
    isSendBranchRequired || isDomainBranchRequired;

  const showScamQuestionnaire = useCallback(() => {
    setVisible(true);
  }, []);

  const hideScamQuestionnaire = useCallback(() => {
    setVisible(false);
  }, []);

  const onScamComplete = useCallback(() => {
    if (securityAlert) {
      setAlertConfirmed(securityAlert.key, true);
    }
    setHasPassed(true);
    setVisible(false);
  }, [securityAlert, setAlertConfirmed]);

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
      trigger: isSendBranchRequired
        ? ScamQuestionnaireTrigger.SecurityAlert
        : ScamQuestionnaireTrigger.DomainList,
    },
  };
}
