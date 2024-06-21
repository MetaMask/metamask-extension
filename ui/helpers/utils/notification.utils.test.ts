import {
  formatAmount,
  formatMenuItemDate,
  getLeadingZeroCount,
  getRandomKey,
  getUsdAmount,
} from './notification.util';

describe('formatMenuItemDate', () => {
  it('should format date as time if the date is today', () => {
    const date = new Date();
    const result = formatMenuItemDate(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/u);
  });

  it('should format date as "yesterday" if the date was yesterday', () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const result = formatMenuItemDate(date);
    expect(result).toBe('yesterday');
  });

  it('should format date as "DD Mon" if the date is this year but not today or yesterday', () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const result = formatMenuItemDate(date);
    expect(result).toMatch(/^\w{3} \d{1,2}$/u);
  });

  it('should format date as "Mon DD, YYYY" if the date is not this year', () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    const result = formatMenuItemDate(date);
    expect(result).toMatch(/^\w{3} \d{1,2}, \d{4}$/u);
  });
});

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

describe('getRandomKey', () => {
  it('should return a string', () => {
    const result = getRandomKey('test', 1);
    expect(typeof result).toBe('string');
  });

  it('should include the provided text and index in the returned string', () => {
    const text = 'test';
    const index = 1;
    const result = getRandomKey(text, index);
    expect(result).toContain(text);
    expect(result).toContain(String(index));
  });

  it('should replace spaces in the provided text with underscores', () => {
    const text = 'test text';
    const index = 1;
    const result = getRandomKey(text, index);
    expect(result).toContain('test_text');
  });

  it('should remove non-word characters from the provided text', () => {
    const text = 'test@text';
    const index = 1;
    const result = getRandomKey(text, index);
    expect(result).toContain('testtext');
  });
});

describe('getUsdAmount', () => {
  it('should return formatted USD amount based on token amount, decimals, and USD rate', () => {
    const amount = '1000000000000000000'; // 1 Ether (1e18 wei)
    const decimals = '18';
    const usdRate = '2000'; // 1 Ether = $2000

    const result = getUsdAmount(amount, decimals, usdRate);
    expect(result).toBe('2K'); // Since 1 Ether * $2000 = $2000, formatted as '2K'
  });

  it('should return an empty string if any of the parameters are missing', () => {
    expect(getUsdAmount('', '18', '2000')).toBe('');
    expect(getUsdAmount('1000000000000000000', '', '2000')).toBe('');
    expect(getUsdAmount('1000000000000000000', '18', '')).toBe('');
  });

  it('should handle small amounts correctly', () => {
    const amount = '1000000000000000'; // 0.001 Ether (1e15 wei)
    const decimals = '18';
    const usdRate = '1500'; // 1 Ether = $1500

    const result = getUsdAmount(amount, decimals, usdRate);
    expect(result).toBe('1.5'); // Since 0.001 Ether * $1500 = $1.5
  });

  it('should handle large amounts correctly', () => {
    const amount = '5000000000000000000000'; // 5000 Ether
    const decimals = '18';
    const usdRate = '1000'; // 1 Ether = $1000

    const result = getUsdAmount(amount, decimals, usdRate);
    expect(result).toBe('5M'); // Since 5000 Ether * $1000 = $5,000,000, formatted as '5M'
  });
});
