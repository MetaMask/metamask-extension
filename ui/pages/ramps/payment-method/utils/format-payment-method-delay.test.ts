import {
  formatPaymentMethodDelay,
  timeToDescription,
} from './format-payment-method-delay';

const t = (key: string) => {
  const messages: Record<string, string> = {
    rampsPaymentDelayInstant: 'Instant',
    rampsPaymentDelayLessThan: '<',
    rampsPaymentDelayMinutes: 'mins',
    rampsPaymentDelayMinute: 'min',
    rampsPaymentDelayHours: 'hours',
    rampsPaymentDelayHour: 'hour',
    rampsPaymentDelayBusinessDays: 'business days',
    rampsPaymentDelayBusinessDay: 'business day',
  };
  return messages[key] ?? key;
};

describe('timeToDescription', () => {
  it('matches snapshot for common delay ranges', () => {
    expect({
      instant: timeToDescription([0, 0]),
      lessThanMinutes: timeToDescription([0, 10]),
      rangeMinutes: timeToDescription([5, 10]),
      rangeHours: timeToDescription([60, 180]),
      rangeDays: timeToDescription([60 * 24, 60 * 24 * 3]),
    }).toMatchSnapshot();
  });
});

describe('formatPaymentMethodDelay', () => {
  it('returns null when delay is missing', () => {
    expect(formatPaymentMethodDelay(undefined, t)).toBeNull();
    expect(formatPaymentMethodDelay([5], t)).toBeNull();
  });

  it('uses spoken wording for an accessible less-than label', () => {
    const tWithLessThanSymbol = (key: string) =>
      key === 'rampsPaymentDelayLessThan' ? '<' : t(key);

    expect(formatPaymentMethodDelay([0, 10], tWithLessThanSymbol, true)).toBe(
      'Less than 10 mins',
    );
  });

  it('glues the less-than glyph to the following number', () => {
    expect(formatPaymentMethodDelay([0, 10], t)).toBe('<10 mins');
    expect(formatPaymentMethodDelay([0, 60], t)).toBe('<1 hour');
    expect(formatPaymentMethodDelay([0, 60 * 24], t)).toBe('<1 business day');
  });

  it('matches snapshot for formatted delay labels', () => {
    expect({
      instant: formatPaymentMethodDelay([0, 0], t),
      lessThan: formatPaymentMethodDelay([0, 10], t),
      range: formatPaymentMethodDelay([5, 10], t),
    }).toMatchSnapshot();
  });
});
