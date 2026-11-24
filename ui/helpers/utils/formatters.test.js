import { formatETHFee } from './formatters';

describe('formatETHFee', () => {
  it('should format fee with default ETH symbol', () => {
    expect(formatETHFee('0.005')).toBe('0.005 ETH');
  });

  it('should format fee with a custom currency symbol', () => {
    expect(formatETHFee('1.25', 'BNB')).toBe('1.25 BNB');
  });

  it('should format fee with MATIC symbol', () => {
    expect(formatETHFee('100', 'MATIC')).toBe('100 MATIC');
  });

  it('should handle zero fee', () => {
    expect(formatETHFee('0')).toBe('0 ETH');
  });

  it('should handle very small fee amounts', () => {
    expect(formatETHFee('0.000000001')).toBe('0.000000001 ETH');
  });

  it('should handle empty string fee', () => {
    expect(formatETHFee('')).toBe(' ETH');
  });

  it('should handle numeric input', () => {
    expect(formatETHFee(0.01)).toBe('0.01 ETH');
  });

  it('should use empty string as currency symbol when passed', () => {
    expect(formatETHFee('5', '')).toBe('5 ');
  });
});
