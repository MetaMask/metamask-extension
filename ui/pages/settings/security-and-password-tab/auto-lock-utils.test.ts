import {
  formatAutoLockLabel,
  AUTO_LOCK_OPTIONS,
  type AutoLockOption,
} from './auto-lock-utils';

const mockT = (key: string, subs?: string[]) => {
  const map: Record<string, string> = {
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
  AUTO_LOCK_OPTIONS.forEach(({ labelKey, value }: AutoLockOption) => {
    it(`returns translated label for preset value ${value}`, () => {
      expect(formatAutoLockLabel(value, mockT)).toBe(mockT(labelKey));
    });
  });

  it('returns custom label for non-preset value', () => {
    expect(formatAutoLockLabel(10, mockT)).toBe(
      mockT('autoLockAfterMinutes', ['10']),
    );
  });

  it('returns custom label for decimal non-preset value', () => {
    expect(formatAutoLockLabel(2.5, mockT)).toBe(
      mockT('autoLockAfterMinutes', ['2.5']),
    );
  });

  it('rounds long decimal non-preset values for readability', () => {
    expect(formatAutoLockLabel(0.1234242423, mockT)).toBe(
      mockT('autoLockAfterMinutes', ['0.12']),
    );
  });
});
