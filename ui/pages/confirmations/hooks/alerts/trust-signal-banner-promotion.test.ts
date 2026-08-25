import {
  applyTrustSignalBannerPromotion,
  TRUST_SIGNAL_BANNER_ALERT_KEYS,
} from './trust-signal-banner-promotion';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';

function makeTrustAlert(
  overrides: Partial<Alert> & Pick<Alert, 'key' | 'severity'>,
): Alert {
  return {
    actions: [],
    field: RowAlertKey.InteractingWith,
    message: 'Trust signal message',
    reason: 'Trust signal reason',
    alertDetails: ['Trust signal message'],
    ...overrides,
  };
}

describe('applyTrustSignalBannerPromotion', () => {
  it('promotes the highest-severity trust-signal alert to a banner when PPOM is absent', () => {
    const trustAlerts = [
      makeTrustAlert({
        key: 'trustSignalWarning',
        severity: Severity.Warning,
      }),
      makeTrustAlert({
        key: 'spenderTrustSignalMalicious',
        severity: Severity.Danger,
        field: RowAlertKey.Spender,
      }),
    ];

    const result = applyTrustSignalBannerPromotion([], trustAlerts);

    expect(result).toHaveLength(2);
    const banner = result.find(
      (alert) => alert.key === 'spenderTrustSignalMalicious',
    );
    expect(banner?.field).toBeUndefined();
    expect(banner?.provider).toBe(SecurityProvider.Blockaid);
    expect(banner?.alertDetails?.length).toBeGreaterThan(0);
    expect(
      result.find((alert) => alert.key === 'trustSignalWarning')?.field,
    ).toBe(RowAlertKey.InteractingWith);
  });

  it('does not promote trust-signal alerts when a PPOM Blockaid banner exists', () => {
    const blockaidAlerts: Alert[] = [
      {
        key: 'ppom-alert',
        severity: Severity.Danger,
        message: 'PPOM',
        reason: 'PPOM',
        provider: SecurityProvider.Blockaid,
      },
    ];
    const trustAlerts = [
      makeTrustAlert({
        key: 'trustSignalMalicious',
        severity: Severity.Danger,
      }),
    ];

    const result = applyTrustSignalBannerPromotion(blockaidAlerts, trustAlerts);

    expect(result).toEqual(trustAlerts);
    expect(result[0].field).toBe(RowAlertKey.InteractingWith);
  });

  it('recognizes all expected trust-signal banner keys', () => {
    expect(TRUST_SIGNAL_BANNER_ALERT_KEYS.has('originTrustSignalWarning')).toBe(
      true,
    );
    expect(
      TRUST_SIGNAL_BANNER_ALERT_KEYS.has('tokenTrustSignalMalicious'),
    ).toBe(true);
  });
});
