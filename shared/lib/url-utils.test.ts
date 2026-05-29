import { getRegistrableDomain } from './url-utils';

describe('getRegistrableDomain', () => {
  it('returns the last two labels for a multi-label hostname', () => {
    expect(getRegistrableDomain('https://mainnet.infura.io/v3/abc')).toBe(
      'infura.io',
    );
  });

  it('groups subdomain-heavy hostnames under the same registrable domain', () => {
    expect(getRegistrableDomain('https://linea-mainnet.infura.io/v3/abc')).toBe(
      'infura.io',
    );
    expect(
      getRegistrableDomain('https://polygon-mainnet.g.alchemy.com/v2/abc'),
    ).toBe('alchemy.com');
  });

  it('returns the hostname as-is when it has exactly two labels', () => {
    expect(getRegistrableDomain('https://alchemy.com/')).toBe('alchemy.com');
  });

  it('returns single-label hosts (e.g., localhost) verbatim', () => {
    expect(getRegistrableDomain('http://localhost:8545')).toBe('localhost');
  });

  it('returns IPv4 addresses verbatim', () => {
    expect(getRegistrableDomain('http://127.0.0.1:8545')).toBe('127.0.0.1');
  });

  it('returns IPv6 addresses verbatim, including brackets', () => {
    expect(getRegistrableDomain('http://[::1]:8545')).toBe('[::1]');
  });

  it('returns null for an invalid URL', () => {
    expect(getRegistrableDomain('not a url')).toBeNull();
  });
});
