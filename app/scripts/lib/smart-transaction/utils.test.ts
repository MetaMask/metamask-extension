import { sanitizeOrigin, toAccountHardwareType } from './utils';

describe('sanitizeOrigin', () => {
  it('extracts hostname from URL with path', () => {
    expect(sanitizeOrigin('https://uniswap.org/swap?token=0x123')).toBe(
      'uniswap.org',
    );
  });

  it('extracts hostname from URL with subdomain', () => {
    expect(sanitizeOrigin('https://app.aave.com/#/markets')).toBe(
      'app.aave.com',
    );
  });

  it('extracts hostname from URL with port', () => {
    expect(sanitizeOrigin('http://localhost:3000/test')).toBe('localhost');
  });

  it('returns internal origin as-is', () => {
    expect(sanitizeOrigin('metamask')).toBe('metamask');
  });

  it('returns MetaMask origin as-is', () => {
    expect(sanitizeOrigin('MetaMask')).toBe('MetaMask');
  });

  it('returns WalletConnect origin as-is', () => {
    expect(sanitizeOrigin('wc::')).toBe('wc::');
  });

  it('returns SDK origin as-is', () => {
    expect(sanitizeOrigin('MMSDKREMOTE::abc123')).toBe('MMSDKREMOTE::abc123');
  });

  it('returns undefined for undefined input', () => {
    expect(sanitizeOrigin(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string input', () => {
    expect(sanitizeOrigin('')).toBeUndefined();
  });
});

describe('toAccountHardwareType', () => {
  it('maps Ledger Hardware to Ledger', () => {
    expect(toAccountHardwareType('Ledger Hardware')).toBe('Ledger');
  });

  it('omits labels that are not known keyring types', () => {
    for (const label of [undefined, '', 'OneKey Hardware', 'Ledger']) {
      expect(toAccountHardwareType(label)).toBeUndefined();
    }
  });
});
