import {
  formatAmount,
  getAmount,
  getLeadingZeroCount,
} from './get-notification-data';

describe('getNotificationData - formatAmount() tests', () => {
  test('Should format large numbers', () => {
    expect(formatAmount(1000)).toBe('1K');
    expect(formatAmount(1500)).toBe('1.5K');
    expect(formatAmount(1000000)).toBe('1M');
    expect(formatAmount(1000000000)).toBe('1B');
    expect(formatAmount(1000000000000)).toBe('1T');
    expect(formatAmount(1234567)).toBe('1.23M');
  });

  test('Should format smaller numbers (<1000) with custom decimal place', () => {
    const formatOptions = { decimalPlaces: 18 };
    expect(formatAmount(100.0012, formatOptions)).toBe('100.0012');
    expect(formatAmount(100.001200001, formatOptions)).toBe('100.001200001');
    expect(formatAmount(1e-18, formatOptions)).toBe('0.000000000000000001');
    expect(formatAmount(1e-19, formatOptions)).toBe('0'); // number is smaller than decimals given, hence 0
  });

  test('Should format small numbers (<1000) up to 4 decimals otherwise uses ellipses', () => {
    const formatOptions = { shouldEllipse: true };
    expect(formatAmount(100.1, formatOptions)).toBe('100.1');
    expect(formatAmount(100.01, formatOptions)).toBe('100.01');
    expect(formatAmount(100.001, formatOptions)).toBe('100.001');
    expect(formatAmount(100.0001, formatOptions)).toBe('100.0001');
    expect(formatAmount(100.00001, formatOptions)).toBe('100.0000...'); // since number is has >4 decimals, it will be truncated
    expect(formatAmount(0.00001, formatOptions)).toBe('0.0000...'); // since number is has >4 decimals, it will be truncated
  });

  test('Should format small numbers (<1000) to custom decimal places and ellipse', () => {
    const formatOptions = { decimalPlaces: 2, shouldEllipse: true };
    expect(formatAmount(100.1, formatOptions)).toBe('100.1');
    expect(formatAmount(100.01, formatOptions)).toBe('100.01');
    expect(formatAmount(100.001, formatOptions)).toBe('100.00...');
    expect(formatAmount(100.0001, formatOptions)).toBe('100.00...');
    expect(formatAmount(100.00001, formatOptions)).toBe('100.00...'); // since number is has >2 decimals, it will be truncated
    expect(formatAmount(0.00001, formatOptions)).toBe('0.00...'); // since number is has >2 decimals, it will be truncated
  });
});

describe('getNotificationData - getAmount() tests', () => {
  test('Should get formatted amount for larger numbers', () => {
    expect(getAmount('1', '2')).toBe('0.01');
    expect(getAmount('10', '2')).toBe('0.1');
    expect(getAmount('100', '2')).toBe('1');
    expect(getAmount('1000', '2')).toBe('10');
    expect(getAmount('10000', '2')).toBe('100');
    expect(getAmount('100000', '2')).toBe('1K');
    expect(getAmount('1000000', '2')).toBe('10K');
  });
  test('Should get formatted amount for small/decimal numbers', () => {
    const formatOptions = { shouldEllipse: true };
    expect(getAmount('100000', '5', formatOptions)).toBe('1');
    expect(getAmount('100001', '5', formatOptions)).toBe('1.0000...');
    expect(getAmount('10000', '5', formatOptions)).toBe('0.1');
    expect(getAmount('1000', '5', formatOptions)).toBe('0.01');
    expect(getAmount('100', '5', formatOptions)).toBe('0.001');
    expect(getAmount('10', '5', formatOptions)).toBe('0.0001');
    expect(getAmount('1', '5', formatOptions)).toBe('0.0000...');
  });
});

describe('getNotificationData - getLeadingZeroCount() tests', () => {
  test('Should handle all test cases', () => {
    expect(getLeadingZeroCount(0)).toBe(0);
    expect(getLeadingZeroCount(-1)).toBe(0);
    expect(getLeadingZeroCount(1e-1)).toBe(0);

    expect(getLeadingZeroCount('1.01')).toBe(1);
    expect(getLeadingZeroCount('3e-2')).toBe(1);
    expect(getLeadingZeroCount('100.001e1')).toBe(1);

    expect(getLeadingZeroCount('0.00120043')).toBe(2);
  });
});
