import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  Severity,
} from '../../../../helpers/constants/design-system';

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
    // Defaults to Severity.Info
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
export function getHighestSeverity(alerts: Alert[]): Severity {
  return alerts.reduce((highestSeverity: Severity, alert: Alert) => {
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
