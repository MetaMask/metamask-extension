import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../shared/constants/security-provider';
import {
  Alert,
  AlertSeverity,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  Severity,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  REASON_TO_DESCRIPTION_TKEY,
  REASON_TO_TITLE_TKEY,
} from '../../../pages/confirmations/components/security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
import { SecurityAlertResponse } from '../../../pages/confirmations/types/confirm';
import { BannerAlertSeverity } from '../../component-library';

/**
 * Returns the background color based on the severity level.
 *
 * @param severity - The severity level.
 * @returns The background color corresponding to the severity level.
 */
export function getSeverityBackground(severity: Severity): BackgroundColor {
  switch (severity) {
    case Severity.Danger:
      return BackgroundColor.errorMuted;
    case Severity.Warning:
      return BackgroundColor.warningMuted;
    default:
      return BackgroundColor.primaryMuted;
  }
}

/**
 * Returns the highest  severity from an array of alerts.
 *
 * @param alerts - An array of alerts.
 * @returns The highest  severity.
 */
export function getHighestSeverity(alerts: Alert[]): AlertSeverity {
  return alerts.reduce((highestSeverity: AlertSeverity, alert: Alert) => {
    if (alert.severity === Severity.Danger) {
      return Severity.Danger;
    } else if (
      alert.severity === Severity.Warning &&
      highestSeverity !== Severity.Danger
    ) {
      return Severity.Warning;
    }
    return highestSeverity;
  }, Severity.Info);
}

/**
 * Converts the severity of a banner alert to the corresponding BannerAlertSeverity.
 *
 * @param severity - The severity of the banner alert.
 * @returns The corresponding BannerAlertSeverity.
 */
export function getBannerAlertSeverity(
  severity: Severity,
): BannerAlertSeverity {
  switch (severity) {
    case Severity.Danger:
      return BannerAlertSeverity.Danger;
    case Severity.Warning:
      return BannerAlertSeverity.Warning;
    default:
      return BannerAlertSeverity.Info;
  }
}

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
 * @returns The normalized Alert object.
 */
export function normalizeProviderAlert(
  securityAlertResponse: SecurityAlertResponse,
  t: ReturnType<typeof useI18nContext>,
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
  };
}
