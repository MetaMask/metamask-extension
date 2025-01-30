import {
  Alert,
  AlertSeverity,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  Severity,
} from '../../../helpers/constants/design-system';
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
 * Returns the highest severity from an array of alerts.
 *
 * @param alerts - An array of alerts.
 * @returns The highest  severity.
 */
export function getHighestSeverity(alerts: Alert[]): AlertSeverity {
  let highestSeverity = Severity.Info;
  alerts.forEach((alert: Alert) => {
    if (alert.severity === Severity.Danger) {
      highestSeverity = Severity.Danger;
    } else if (
      alert.severity === Severity.Warning &&
      highestSeverity !== Severity.Danger
    ) {
      highestSeverity = Severity.Warning;
    }
  });

  return highestSeverity;
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
