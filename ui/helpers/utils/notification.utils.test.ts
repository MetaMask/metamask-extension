import {
  formatAmount,
  formatMenuItemDate,
  getLeadingZeroCount,
  getRandomKey,
  getUsdAmount,
} from './notification.util';

describe('formatMenuItemDate', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-07T09:40:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should format date as time if the date is today', () => {
    const assertToday = (modifyDate?: (d: Date) => void) => {
      const testDate = new Date();
      modifyDate?.(testDate);
      expect(formatMenuItemDate(testDate)).toMatch(/^\d{2}:\d{2}$/u);
    };

    // assert current date
    assertToday();

    // assert 1 hour ago
    assertToday((testDate) => {
      testDate.setHours(testDate.getHours() - 1);
      return testDate;
    });
  });

  it('should format date as "yesterday" if the date was yesterday', () => {
    const assertYesterday = (modifyDate: (d: Date) => void) => {
      const testDate = new Date();
      modifyDate(testDate);
      expect(formatMenuItemDate(testDate)).toBe('yesterday');
    };

    // assert exactly 1 day ago
    assertYesterday((testDate) => {
      testDate.setDate(testDate.getDate() - 1);
    });

    // assert almost a day ago, but was still yesterday
    // E.g. if Today way 09:40AM, but date to test was 23 hours ago (yesterday at 10:40AM), we still want to to show yesterday
    assertYesterday((testDate) => {
      testDate.setDate(testDate.getDate() - 1);
      testDate.setHours(testDate.getHours() + 1);
    });
  });

  it('should format date as "DD Mon" if the date is this year but not today or yesterday', () => {
    const assertMonthsAgo = (modifyDate: (d: Date) => Date | void) => {
      let testDate = new Date();
      testDate = modifyDate(testDate) ?? testDate;
      expect(formatMenuItemDate(testDate)).toMatch(/^\w{3} \d{1,2}$/u);
    };

    // assert exactly 1 month ago
    assertMonthsAgo((testDate) => {
      testDate.setMonth(testDate.getMonth() - 1);
    });

    // assert 2 months ago
    assertMonthsAgo((testDate) => {
      testDate.setMonth(testDate.getMonth() - 2);
    });

    // assert almost a month ago (where it is a new month, but not 30 days)
    assertMonthsAgo(() => {
      // jest mock date is set in july, so we will test with month may
      return new Date('2024-05-20T09:40:00Z');
    });
  });

  it('should format date as "Mon DD, YYYY" if the date is not this year', () => {
    const assertYearsAgo = (modifyDate: (d: Date) => Date | void) => {
      let testDate = new Date();
      testDate = modifyDate(testDate) ?? testDate;
      expect(formatMenuItemDate(testDate)).toMatch(/^\w{3} \d{1,2}, \d{4}$/u);
    };

    // assert exactly 1 year ago
    assertYearsAgo((testDate) => {
      testDate.setFullYear(testDate.getFullYear() - 1);
    });

    // assert 2 years ago
    assertYearsAgo((testDate) => {
      testDate.setFullYear(testDate.getFullYear() - 2);
    });

    // assert almost a year ago (where it is a new year, but not 365 days ago)
    assertYearsAgo(() => {
      // jest mock date is set in 2024, so we will test with year 2023
      return new Date('2023-11-20T09:40:00Z');
    });
  });
});

describe('getNotificationData - formatAmount() tests', () => {
  it('should format large numbers', () => {
    expect(formatAmount(1000)).toBe('1K');
    expect(formatAmount(1500)).toBe('1.5K');
    expect(formatAmount(1000000)).toBe('1M');
    expect(formatAmount(1000000000)).toBe('1B');
    expect(formatAmount(1000000000000)).toBe('1T');
    expect(formatAmount(1234567)).toBe('1.23M');
  });

  it('should format smaller numbers (<1000) with custom decimal place', () => {
    const formatOptions = { decimalPlaces: 18 };
    expect(formatAmount(100.0012, formatOptions)).toBe('100.0012');
    expect(formatAmount(100.001200001, formatOptions)).toBe('100.001200001');
    expect(formatAmount(1e-18, formatOptions)).toBe('0.000000000000000001');
    expect(formatAmount(1e-19, formatOptions)).toBe('0'); // number is smaller than decimals given, hence 0
  });

  it('should format small numbers (<1000) up to 4 decimals otherwise uses ellipses', () => {
    const formatOptions = { shouldEllipse: true };
    expect(formatAmount(100.1, formatOptions)).toBe('100.1');
    expect(formatAmount(100.01, formatOptions)).toBe('100.01');
    expect(formatAmount(100.001, formatOptions)).toBe('100.001');
    expect(formatAmount(100.0001, formatOptions)).toBe('100.0001');
    expect(formatAmount(100.00001, formatOptions)).toBe('100.0000...'); // since number is has >4 decimals, it will be truncated
    expect(formatAmount(0.00001, formatOptions)).toBe('0.0000...'); // since number is has >4 decimals, it will be truncated
  });

  it('should format small numbers (<1000) to custom decimal places and ellipse', () => {
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
  it('should handle all test cases', () => {
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
