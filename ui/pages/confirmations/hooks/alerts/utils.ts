import {
  BlockaidReason,
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  Alert,
  AlertSeverity,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SecurityAlertResponse } from '../../types/confirm';
import {
  REASON_TO_DESCRIPTION_TKEY,
  REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY,
  REASON_TO_MARKETPLACE_NAME,
  REASON_TO_TITLE_TKEY,
} from './constants';

/**
 * Returns the corresponding AlertSeverity based on the provided BlockaidResultType.
 *
 * @param severity - The BlockaidResultType to determine the AlertSeverity for.
 * @returns The AlertSeverity corresponding to the provided BlockaidResultType.
 */
export function getProviderAlertSeverity(
  severity: BlockaidResultType,
): AlertSeverity {
  switch (severity) {
    case BlockaidResultType.Malicious:
      return Severity.Danger;
    case BlockaidResultType.Warning:
      return Severity.Warning;
    default:
      return Severity.Info;
  }
}

/**
 * Returns the localized banner description for a security alert reason.
 *
 * @param reason - The Blockaid reason.
 * @param t - The translation function.
 * @param sendingFiatTotal - Formatted fiat total of outgoing assets, or null
 * when unavailable. When present, amount-bearing copy variants are used.
 * @returns The localized description.
 */
export function getProviderAlertMessage(
  reason: BlockaidReason,
  t: ReturnType<typeof useI18nContext>,
  sendingFiatTotal?: string | null,
): string {
  const withAmountKey =
    REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY[
      reason as keyof typeof REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY
    ];

  if (withAmountKey && sendingFiatTotal) {
    return t(withAmountKey, [sendingFiatTotal]);
  }

  const marketplaceName =
    REASON_TO_MARKETPLACE_NAME[
      reason as keyof typeof REASON_TO_MARKETPLACE_NAME
    ];

  if (marketplaceName) {
    return t('blockaidDescriptionMarketplaceFarming', [marketplaceName]);
  }

  return t(
    REASON_TO_DESCRIPTION_TKEY[
      reason as keyof typeof REASON_TO_DESCRIPTION_TKEY
    ] || REASON_TO_DESCRIPTION_TKEY.other,
  );
}

/**
 * Normalizes a security alert response into an Alert object.
 *
 * @param securityAlertResponse - The security alert response to normalize.
 * @param t - The translation function.
 * @param reportUrl - URL to report.
 * @param sendingFiatTotal - Formatted fiat total of outgoing assets, or null
 * when unavailable.
 * @returns The normalized Alert object.
 */
export function normalizeProviderAlert(
  securityAlertResponse: SecurityAlertResponse,
  t: ReturnType<typeof useI18nContext>,
  reportUrl?: string,
  sendingFiatTotal?: string | null,
): Alert {
  return {
    key: securityAlertResponse.securityAlertId || '',
    reason: t(
      REASON_TO_TITLE_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_TITLE_TKEY
      ] || 'blockaidTitleRiskSignalsDetected',
    ),
    severity: getProviderAlertSeverity(
      securityAlertResponse.result_type as BlockaidResultType,
    ),
    alertDetails: securityAlertResponse.features,
    message: getProviderAlertMessage(
      securityAlertResponse.reason as BlockaidReason,
      t,
      sendingFiatTotal,
    ),
    provider: SecurityProvider.Blockaid, // TODO: Remove this once we support more providers and implement a way to determine it.
    reportUrl,
  };
}
