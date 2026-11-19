import { formatRelativeMediumDate } from './useRelativeMediumDate';

describe('formatRelativeMediumDate', () => {
  const formatMediumDate = (timestamp: string | number) =>
    `formatted:${timestamp}`;
  const locale = 'en-US';
  const now = new Date('2025-01-02T15:30:00Z');

  it('returns today for the current calendar day', () => {
    const today = new Date('2025-01-02T08:00:00Z');
    today.setHours(0, 0, 0, 0);

    expect(
      formatRelativeMediumDate(today.getTime(), locale, formatMediumDate, now),
    ).toBe('today');
  });

  it('returns yesterday for the previous calendar day', () => {
    const yesterday = new Date('2025-01-01T20:00:00Z');
    yesterday.setHours(0, 0, 0, 0);

    expect(
      formatRelativeMediumDate(
        yesterday.getTime(),
        locale,
        formatMediumDate,
        now,
      ),
    ).toBe('yesterday');
  });

  it('falls back to formatMediumDate for older dates', () => {
    const older = new Date('2024-12-31T12:00:00Z');
    older.setHours(0, 0, 0, 0);

    expect(
      formatRelativeMediumDate(older.getTime(), locale, formatMediumDate, now),
    ).toBe(`formatted:${older.getTime()}`);
  });
});
