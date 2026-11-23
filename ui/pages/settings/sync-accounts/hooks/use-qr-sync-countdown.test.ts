import { getQrSyncSecondsLeft } from './use-qr-sync-countdown';

describe('getQrSyncSecondsLeft', () => {
  it('returns null when the session has no expiry', () => {
    expect(getQrSyncSecondsLeft(null, 1_000_000)).toBeNull();
    expect(getQrSyncSecondsLeft(undefined, 1_000_000)).toBeNull();
  });

  it('returns the same remaining seconds for one expiry at a given time', () => {
    const expiresAt = 1_000_000 + 21_000;

    expect(getQrSyncSecondsLeft(expiresAt, 1_000_000)).toBe(21);
    expect(getQrSyncSecondsLeft(expiresAt, 1_006_000)).toBe(15);
  });

  it('rounds up a partial second so the label stays visible until expiry', () => {
    expect(getQrSyncSecondsLeft(1_000_500, 1_000_000)).toBe(1);
  });

  it('returns 0 once the expiry has passed', () => {
    expect(getQrSyncSecondsLeft(1_000_000, 1_021_000)).toBe(0);
  });
});
