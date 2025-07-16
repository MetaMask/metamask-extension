import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  Alert,
  AlertSeverity,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  REASON_TO_DESCRIPTION_TKEY,
  REASON_TO_TITLE_TKEY,
} from '../../components/security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import { SecurityAlertResponse } from '../../types/confirm';

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
 * Normalizes a security alert response into an Alert object.
 *
 * @param securityAlertResponse - The security alert response to normalize.
 * @param t - The translation function.
 * @param reportUrl - URL to report.
 * @returns The normalized Alert object.
 */
export function normalizeProviderAlert(
  securityAlertResponse: SecurityAlertResponse,
  t: ReturnType<typeof useI18nContext>,
  reportUrl?: string,
): Alert {
  return {
    key: securityAlertResponse.securityAlertId || '',
    reason: t(
      REASON_TO_TITLE_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_TITLE_TKEY
      ] || 'blockaidTitleDeceptive',
    ),
    severity: getProviderAlertSeverity(
      securityAlertResponse.result_type as BlockaidResultType,
    ),
    alertDetails: securityAlertResponse.features,
    message: t(
      REASON_TO_DESCRIPTION_TKEY[
        securityAlertResponse.reason as keyof typeof REASON_TO_DESCRIPTION_TKEY
      ] || REASON_TO_DESCRIPTION_TKEY.other,
    ),
    provider: SecurityProvider.Blockaid, // TODO: Remove this once we support more providers and implement a way to determine it.
    reportUrl,
  };
}
