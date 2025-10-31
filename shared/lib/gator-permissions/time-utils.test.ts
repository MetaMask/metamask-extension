import { bigIntToHex } from '@metamask/utils';
import { Settings } from 'luxon';
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
  beforeAll(() => {
    // Set Luxon to use UTC as the default timezone for consistent test results
    Settings.defaultZone = 'utc';
  });

  afterAll(() => {
    // Reset to system default
    Settings.defaultZone = 'system';
  });

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
    it('should convert a Unix timestamp to mm/dd/yyyy format', () => {
      const timestamp = 1736271776; // January 7, 2025;
      const result = convertTimestampToReadableDate(timestamp);
      expect(result).toBe('01/07/2025');
    });

    it('should handle different dates correctly', () => {
      const timestamp = 1756921376; // September 3, 2025
      const result = convertTimestampToReadableDate(timestamp);
      expect(result).toBe('09/03/2025');
    });

    it('should throw an error for invalid date format', () => {
      const timestamp = NaN;
      expect(() => convertTimestampToReadableDate(timestamp)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('extractExpiryToReadableDate', () => {
    it('extracts and converts expiry timestamp from rules', () => {
      const rules: GatorPermissionRule[] = [
        {
          type: 'expiry',
          isAdjustmentAllowed: false,
          data: {
            timestamp: 1744588800, // April 14, 2025
          },
        },
      ];

      const result = extractExpiryToReadableDate(rules);
      expect(result).toBe('04/14/2025');
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
