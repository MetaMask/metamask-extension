import { formatAutoLockLabel, AUTO_LOCK_OPTIONS } from './auto-lock-utils';

const mockT = (key: string, subs?: string[]) => {
  const map: Record<string, string> = {
    autoLockImmediately: 'Immediately',
    autoLockAfter15Seconds: 'After 15 seconds',
    autoLockAfter30Seconds: 'After 30 seconds',
    autoLockAfter1Minute: 'After 1 minute',
    autoLockAfter5Minutes: 'After 5 minutes',
    autoLockNever: 'Never',
  };
  if (key === 'autoLockAfterMinutes' && subs) {
    return `After ${subs[0]} minutes`;
  }
  return map[key] ?? key;
};

describe('formatAutoLockLabel', () => {
  it.each(AUTO_LOCK_OPTIONS)(
    'returns translated label for preset value $value',
    ({ labelKey, value }) => {
      expect(formatAutoLockLabel(value, mockT)).toBe(mockT(labelKey));
    },
  );

  it('returns custom label for non-preset value', () => {
    expect(formatAutoLockLabel(10, mockT)).toBe('After 10 minutes');
  });

  it('returns custom label for decimal non-preset value', () => {
    expect(formatAutoLockLabel(2.5, mockT)).toBe('After 2.5 minutes');
  });
});
