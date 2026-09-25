import {
  formatSubscriptionDate,
  formatSubscriptionPeriod,
} from './format-subscription-date';

describe('formatSubscriptionDate', () => {
  it('formats a defined date', () => {
    expect(formatSubscriptionDate('2024-04-18')).toBe(
      Intl.DateTimeFormat(navigator.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date('2024-04-18')),
    );
  });

  it('omits an unavailable date', () => {
    expect(formatSubscriptionDate()).toBeUndefined();
  });
});

describe('formatSubscriptionPeriod', () => {
  it('omits a period when either date is unavailable', () => {
    expect(formatSubscriptionPeriod(undefined, '2024-04-18')).toBeUndefined();
    expect(formatSubscriptionPeriod('2024-04-18')).toBeUndefined();
  });
});
