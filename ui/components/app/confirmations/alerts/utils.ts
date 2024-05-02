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
