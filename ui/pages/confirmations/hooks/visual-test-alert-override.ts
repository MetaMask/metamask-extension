import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../helpers/constants/design-system';
import { SecurityAlertResponse } from '../types/confirm';
import { VISUAL_TEST_ONLY_ALERT_ID } from './visual-test-only-alert.config';

type TrustSignalVisualSpec = {
  field: RowAlertKey;
  key: string;
  severity: Severity;
  messageKey: string;
  reasonKey: string;
};

const TRUST_SIGNAL_VISUAL_SPECS: Record<string, TrustSignalVisualSpec> = {
  trustSignalMalicious: {
    field: RowAlertKey.InteractingWith,
    key: 'trustSignalMalicious',
    severity: Severity.Danger,
    messageKey: 'alertMessageAddressTrustSignalMalicious',
    reasonKey: 'nameModalTitleMalicious',
  },
  trustSignalWarning: {
    field: RowAlertKey.InteractingWith,
    key: 'trustSignalWarning',
    severity: Severity.Warning,
    messageKey: 'alertMessageAddressTrustSignal',
    reasonKey: 'nameModalTitleWarning',
  },
  originTrustSignalMalicious: {
    field: RowAlertKey.RequestFrom,
    key: 'originTrustSignalMalicious',
    severity: Severity.Danger,
    messageKey: 'alertMessageOriginTrustSignalMalicious',
    reasonKey: 'alertReasonOriginTrustSignalMalicious',
  },
  originTrustSignalWarning: {
    field: RowAlertKey.RequestFrom,
    key: 'originTrustSignalWarning',
    severity: Severity.Warning,
    messageKey: 'alertMessageOriginTrustSignalWarning',
    reasonKey: 'alertReasonOriginTrustSignalWarning',
  },
  spenderTrustSignalMalicious: {
    field: RowAlertKey.Spender,
    key: 'spenderTrustSignalMalicious',
    severity: Severity.Danger,
    messageKey: 'alertMessageAddressTrustSignalMalicious',
    reasonKey: 'nameModalTitleMalicious',
  },
  spenderTrustSignalWarning: {
    field: RowAlertKey.Spender,
    key: 'spenderTrustSignalWarning',
    severity: Severity.Warning,
    messageKey: 'alertMessageAddressTrustSignal',
    reasonKey: 'nameModalTitleWarning',
  },
  tokenTrustSignalMalicious: {
    field: RowAlertKey.IncomingTokens,
    key: 'tokenTrustSignalMalicious',
    severity: Severity.Danger,
    messageKey: 'alertMessageTokenTrustSignalMalicious',
    reasonKey: 'alertReasonTokenTrustSignalMalicious',
  },
  tokenTrustSignalWarning: {
    field: RowAlertKey.IncomingTokens,
    key: 'tokenTrustSignalWarning',
    severity: Severity.Warning,
    messageKey: 'alertMessageTokenTrustSignalWarning',
    reasonKey: 'alertReasonTokenTrustSignalWarning',
  },
};

type TransactionAlertVisualSpec = {
  field: RowAlertKey;
  key: string;
  severity: Severity;
  messageKey?: string;
  reasonKey: string;
  contentKey?: string;
};

const TRANSACTION_ALERT_VISUAL_SPECS: Record<string, TransactionAlertVisualSpec> =
  {
    'simulationDetailsTitle-resimulation': {
      field: RowAlertKey.Resimulation,
      key: 'simulationDetailsTitle',
      severity: Severity.Danger,
      messageKey: 'alertMessageChangeInSimulationResults',
      reasonKey: 'alertReasonChangeInSimulationResults',
    },
    multipleApprovals: {
      field: RowAlertKey.EstimatedChangesStatic,
      key: 'multipleApprovals',
      severity: Severity.Danger,
      reasonKey: 'alertReasonMultipleApprovals',
      contentKey: 'alertContentMultipleApprovals',
    },
  };

export function getVisualTestOnlyAlertId(): string | null {
  return VISUAL_TEST_ONLY_ALERT_ID;
}

export function isVisualTestOnlyAlertMode(): boolean {
  return Boolean(getVisualTestOnlyAlertId());
}

type BlockaidVisualTestSpec = {
  resultType: BlockaidResultType;
  reason: BlockaidReason;
  features: string[];
};

const BLOCKAID_VISUAL_TEST_SPECS: Record<string, BlockaidVisualTestSpec> = {
  'blockaid-approval-farming': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.approvalFarming,
    features: ['Approval to a known malicious spender'],
  },
  'blockaid-transfer-farming': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.transferFarming,
    features: ['Transfer to a known malicious address'],
  },
  'blockaid-seaport-farming': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.seaportFarming,
    features: ['OpenSea order may expose assets to a malicious party'],
  },
  'blockaid-blur-farming': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.blurFarming,
    features: ['Blur order may expose assets to a malicious party'],
  },
  'blockaid-malicious-domain': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.maliciousDomain,
    features: ['Requesting site identified as malicious'],
  },
  'blockaid-signature-order-farming': {
    resultType: BlockaidResultType.Malicious,
    reason: BlockaidReason.rawSignatureFarming,
    features: ['Signature may expose assets to a malicious party'],
  },
  'blockaid-signature-order-farming-warning': {
    resultType: BlockaidResultType.Warning,
    reason: BlockaidReason.tradeOrderFarming,
    features: ['Trade order shows suspicious patterns'],
  },
  'blockaid-other-ppom': {
    resultType: BlockaidResultType.Warning,
    reason: BlockaidReason.other,
    features: ['This transaction shows suspicious patterns'],
  },
  'blockaid-errored': {
    resultType: BlockaidResultType.Errored,
    reason: BlockaidReason.errored,
    features: [],
  },
};

export function getVisualTestTransactionAlerts(
  onlyId: string | null,
  t: (key: string) => string,
): Alert[] | null {
  const spec = onlyId ? TRANSACTION_ALERT_VISUAL_SPECS[onlyId] : undefined;
  if (!spec) {
    return null;
  }

  return [
    {
      actions: [],
      field: spec.field,
      isBlocking: false,
      key: spec.key,
      ...(spec.messageKey ? { message: t(spec.messageKey) } : {}),
      ...(spec.contentKey ? { content: t(spec.contentKey) } : {}),
      reason: t(spec.reasonKey),
      severity: spec.severity,
    },
  ];
}

export function getVisualTestTrustSignalAlerts(
  onlyId: string | null,
  t: (key: string) => string,
): Alert[] | null {
  const spec = onlyId ? TRUST_SIGNAL_VISUAL_SPECS[onlyId] : undefined;
  if (!spec) {
    return null;
  }

  return [
    {
      actions: [],
      field: spec.field,
      isBlocking: false,
      key: spec.key,
      message: t(spec.messageKey),
      reason: t(spec.reasonKey),
      severity: spec.severity,
    },
  ];
}

export function getVisualTestBlockaidMock(): SecurityAlertResponse | null {
  const onlyId = getVisualTestOnlyAlertId();
  if (!onlyId?.startsWith('blockaid-')) {
    return null;
  }
  const spec = BLOCKAID_VISUAL_TEST_SPECS[onlyId];
  if (!spec) {
    return null;
  }
  return {
    securityAlertId: `visual-test-${onlyId}`,
    result_type: spec.resultType,
    reason: spec.reason,
    features: spec.features,
    block: 1,
  };
}
