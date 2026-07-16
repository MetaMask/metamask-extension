import { isProviderLimitError } from './isProviderLimitError';

describe('isProviderLimitError', () => {
  it('returns false for empty values', () => {
    expect(isProviderLimitError(null)).toBe(false);
    expect(isProviderLimitError(undefined)).toBe(false);
    expect(isProviderLimitError('')).toBe(false);
  });

  it('detects min and max purchase limit messages', () => {
    expect(isProviderLimitError('Minimum purchase is 12 EUR')).toBe(true);
    expect(isProviderLimitError('Maximum purchase is 20 EUR')).toBe(true);
  });

  it('rejects non-limit provider errors', () => {
    expect(isProviderLimitError('Amount is outside the supported range')).toBe(
      false,
    );
    expect(isProviderLimitError('Internal server error')).toBe(false);
  });
});
