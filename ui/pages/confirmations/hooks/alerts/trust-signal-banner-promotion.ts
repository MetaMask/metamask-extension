import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';

const SEVERITY_RANK: Record<string, number> = {
  [Severity.Danger]: 3,
  [Severity.Warning]: 2,
  [Severity.Info]: 1,
  [Severity.Success]: 0,
  [Severity.Disabled]: 0,
};

/**
 * Trust-signal alert keys that may be promoted to the confirmation banner.
 */
export const TRUST_SIGNAL_BANNER_ALERT_KEYS = new Set([
  'trustSignalMalicious',
  'trustSignalWarning',
  'tokenTrustSignalMalicious',
  'tokenTrustSignalWarning',
  'originTrustSignalMalicious',
  'originTrustSignalWarning',
  'spenderTrustSignalMalicious',
  'spenderTrustSignalWarning',
]);

function severityRank(severity: Alert['severity']): number {
  return SEVERITY_RANK[severity] ?? 0;
}

/**
 * When PPOM Blockaid already owns the banner, leave trust-signal alerts as
 * field/inline alerts. Otherwise promote the highest-severity trust-signal
 * alert to a single banner (omit `field`) so ConfirmBannerAlert shows at most
 * one security banner.
 *
 * @param blockaidAlerts - PPOM Blockaid alerts (already banner-shaped).
 * @param trustSignalAlerts - Address/token/origin/spender trust-signal alerts.
 * @returns Trust-signal alerts after promotion / dedupe against PPOM.
 */
export function applyTrustSignalBannerPromotion(
  blockaidAlerts: Alert[],
  trustSignalAlerts: Alert[],
): Alert[] {
  if (trustSignalAlerts.length === 0) {
    return trustSignalAlerts;
  }

  // PPOM banner wins — never stack a second security banner.
  if (blockaidAlerts.length > 0) {
    return trustSignalAlerts;
  }

  const candidates = trustSignalAlerts.filter((alert) =>
    TRUST_SIGNAL_BANNER_ALERT_KEYS.has(alert.key),
  );

  if (candidates.length === 0) {
    return trustSignalAlerts;
  }

  const primary = candidates.reduce((best, alert) =>
    severityRank(alert.severity) > severityRank(best.severity) ? alert : best,
  );

  const bannerAlert: Alert = {
    ...primary,
    field: undefined,
    provider: primary.provider ?? SecurityProvider.Blockaid,
    alertDetails:
      primary.alertDetails && primary.alertDetails.length > 0
        ? primary.alertDetails
        : [primary.message || primary.reason || ''].filter(Boolean),
  };

  // Ensure Report / See details can render even if copy is empty.
  if (!bannerAlert.alertDetails?.length) {
    bannerAlert.alertDetails = [bannerAlert.reason || bannerAlert.key];
  }

  return [
    bannerAlert,
    ...trustSignalAlerts.filter((alert) => alert.key !== primary.key),
  ];
}
