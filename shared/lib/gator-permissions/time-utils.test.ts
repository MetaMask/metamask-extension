import { bigIntToHex } from '@metamask/utils';
import {
  DAY,
  FORTNIGHT,
  MONTH,
  SECOND,
  WEEK,
  YEAR,
} from '../../constants/time';
import {
  convertAmountPerSecondToAmountPerPeriod,
  convertMillisecondsToSeconds,
  convertTimestampToReadableDate,
  extractExpiryToReadableDate,
  getPeriodFrequencyValueTranslationKey,
  GatorPermissionRule,
} from './time-utils';

describe('time-utils', () => {
  /**
   * Helper function to create a timestamp from a date in local timezone
   *
   * @param year - The year
   * @param month - The month (0-11)
   * @param day - The day of the month
   * @returns Unix timestamp in seconds
   */
  const createTimestamp = (
    year: number,
    month: number,
    day: number,
  ): number => {
    const testDate = new Date(year, month, day, 12, 0, 0);
    return Math.floor(testDate.getTime() / 1000);
  };

  describe('getPeriodFrequencyValueTranslationKey', () => {
    it('returns daily frequency for 1 day period', () => {
      const result = getPeriodFrequencyValueTranslationKey(DAY / SECOND);
      expect(result).toBe('gatorPermissionDailyFrequency');
    });

    it('returns weekly frequency for 1 week period', () => {
      const result = getPeriodFrequencyValueTranslationKey(WEEK / SECOND);
      expect(result).toBe('gatorPermissionWeeklyFrequency');
    });

    it('returns fortnightly frequency for 2 weeks period', () => {
      const result = getPeriodFrequencyValueTranslationKey(FORTNIGHT / SECOND);
      expect(result).toBe('gatorPermissionFortnightlyFrequency');
    });

    it('returns monthly frequency for 1 month period', () => {
      const result = getPeriodFrequencyValueTranslationKey(MONTH / SECOND);
      expect(result).toBe('gatorPermissionMonthlyFrequency');
    });

    it('returns annual frequency for 1 year period', () => {
      const result = getPeriodFrequencyValueTranslationKey(YEAR / SECOND);
      expect(result).toBe('gatorPermissionAnnualFrequency');
    });

    it('returns custom frequency for arbitrary period', () => {
      const result = getPeriodFrequencyValueTranslationKey(123456);
      expect(result).toBe('gatorPermissionCustomFrequency');
    });

    it('returns custom frequency for zero period', () => {
      const result = getPeriodFrequencyValueTranslationKey(0);
      expect(result).toBe('gatorPermissionCustomFrequency');
    });
  });

  describe('convertMillisecondsToSeconds', () => {
    it('converts milliseconds to seconds correctly', () => {
      expect(convertMillisecondsToSeconds(1000)).toBe(1);
      expect(convertMillisecondsToSeconds(5000)).toBe(5);
      expect(convertMillisecondsToSeconds(60000)).toBe(60);
    });

    it('converts 0 milliseconds to 0 seconds', () => {
      expect(convertMillisecondsToSeconds(0)).toBe(0);
    });

    it('handles fractional seconds', () => {
      expect(convertMillisecondsToSeconds(1500)).toBe(1.5);
      expect(convertMillisecondsToSeconds(250)).toBe(0.25);
    });

    it('converts WEEK constant correctly', () => {
      // WEEK is in milliseconds, should be 604800 seconds
      expect(convertMillisecondsToSeconds(WEEK)).toBe(604800);
    });
  });

  describe('convertAmountPerSecondToAmountPerPeriod', () => {
    it('converts amount per second to weekly amount', () => {
      // 0x1 = 1 per second
      // 1 * 604,800 seconds/week = 604,800
      const result = convertAmountPerSecondToAmountPerPeriod('0x1', 'weekly');
      expect(result).toBe(bigIntToHex(BigInt(604800)));
    });

    it('converts amount per second to monthly amount', () => {
      // 0x1 = 1 per second
      const result = convertAmountPerSecondToAmountPerPeriod('0x1', 'monthly');
      const expectedSeconds = MONTH / SECOND;
      expect(result).toBe(bigIntToHex(BigInt(expectedSeconds)));
    });

    it('converts amount per second to fortnightly amount', () => {
      // 0x1 = 1 per second
      const result = convertAmountPerSecondToAmountPerPeriod(
        '0x1',
        'fortnightly',
      );
      const expectedSeconds = FORTNIGHT / SECOND;
      expect(result).toBe(bigIntToHex(BigInt(expectedSeconds)));
    });

    it('converts amount per second to yearly amount', () => {
      // 0x1 = 1 per second
      const result = convertAmountPerSecondToAmountPerPeriod('0x1', 'yearly');
      const expectedSeconds = YEAR / SECOND;
      expect(result).toBe(bigIntToHex(BigInt(expectedSeconds)));
    });

    it('converts larger amounts correctly', () => {
      // 0x6f05b59d3b20000 = 500000000000000000 (0.5 ETH in wei)
      // 0.5 ETH/sec * 604,800 seconds/week = 302,400 ETH/week
      const result = convertAmountPerSecondToAmountPerPeriod(
        '0x6f05b59d3b20000',
        'weekly',
      );
      const expected = BigInt('500000000000000000') * BigInt(604800);
      expect(result).toBe(bigIntToHex(expected));
    });

    it('converts zero amount correctly', () => {
      const result = convertAmountPerSecondToAmountPerPeriod('0x0', 'weekly');
      expect(result).toBe('0x0');
    });

    it('throws error for invalid period', () => {
      expect(() =>
        convertAmountPerSecondToAmountPerPeriod('0x1', 'invalid' as 'weekly'),
      ).toThrow('Invalid period: invalid');
    });
  });

  describe('convertTimestampToReadableDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('converts timestamp to mm/dd/yyyy format', () => {
      const timestamp = createTimestamp(2025, 0, 15);
      const result = convertTimestampToReadableDate(timestamp);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/u);
      const [month, day, year] = result.split('/');
      expect(month).toBe('01');
      expect(day).toBe('15');
      expect(year).toBe('2025');
    });

    it('returns empty string for timestamp 0', () => {
      const result = convertTimestampToReadableDate(0);
      expect(result).toBe('');
    });

    it('converts timestamp with proper padding', () => {
      const timestamp = createTimestamp(2024, 2, 5);
      const result = convertTimestampToReadableDate(timestamp);

      const [month, day, year] = result.split('/');
      expect(month).toBe('03');
      expect(day).toBe('05');
      expect(year).toBe('2024');
    });

    it('handles dates at end of month', () => {
      const timestamp = createTimestamp(2025, 11, 31);
      const result = convertTimestampToReadableDate(timestamp);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/u);
      const [month, day, year] = result.split('/');
      expect(month).toBe('12');
      expect(day).toBe('31');
      expect(year).toBe('2025');
    });

    it('pads single digit months and days with zeros', () => {
      const timestamp = createTimestamp(2025, 1, 1);
      const result = convertTimestampToReadableDate(timestamp);

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/u);
      const [month, day] = result.split('/');
      expect(month).toHaveLength(2);
      expect(day).toHaveLength(2);
    });
  });

  describe('extractExpiryToReadableDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('extracts and converts expiry timestamp from rules', () => {
      const timestamp = createTimestamp(2025, 5, 15);

      const rules: GatorPermissionRule[] = [
        {
          type: 'expiry',
          isAdjustmentAllowed: false,
          data: {
            timestamp,
          },
        },
      ];

      const result = extractExpiryToReadableDate(rules);

      // Verify format and expected date
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/u);
      const [month, day, year] = result.split('/');
      expect(month).toBe('06');
      expect(day).toBe('15');
      expect(year).toBe('2025');
    });

    it('returns empty string when no expiry rule exists', () => {
      const rules: GatorPermissionRule[] = [
        {
          type: 'other-rule',
          isAdjustmentAllowed: false,
          data: {
            someData: 'value',
          },
        },
      ];

      const result = extractExpiryToReadableDate(rules);
      expect(result).toBe('');
    });

    it('returns empty string for empty rules array', () => {
      const rules: GatorPermissionRule[] = [];
      const result = extractExpiryToReadableDate(rules);
      expect(result).toBe('');
    });

    it('returns empty string when expiry timestamp is 0', () => {
      const rules: GatorPermissionRule[] = [
        {
          type: 'expiry',
          isAdjustmentAllowed: false,
          data: {
            timestamp: 0,
          },
        },
      ];

      const result = extractExpiryToReadableDate(rules);
      expect(result).toBe('');
    });
  });
});
