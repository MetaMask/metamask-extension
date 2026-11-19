import { isLocalhostOrIPAddress } from './url-utils';

describe('isLocalhostOrIPAddress', () => {
  it('returns true for "localhost" (any case)', () => {
    expect(isLocalhostOrIPAddress('localhost')).toBe(true);
    expect(isLocalhostOrIPAddress('LOCALHOST')).toBe(true);
  });

  it('returns true for IPv4 addresses', () => {
    expect(isLocalhostOrIPAddress('127.0.0.1')).toBe(true);
    expect(isLocalhostOrIPAddress('10.0.0.1')).toBe(true);
    expect(isLocalhostOrIPAddress('8.8.8.8')).toBe(true);
  });

  it('returns true for IPv6 addresses (with or without brackets)', () => {
    expect(isLocalhostOrIPAddress('::1')).toBe(true);
    expect(isLocalhostOrIPAddress('[::1]')).toBe(true);
  });

  it('returns false for regular hostnames', () => {
    expect(isLocalhostOrIPAddress('infura.io')).toBe(false);
    expect(isLocalhostOrIPAddress('mainnet.infura.io')).toBe(false);
    expect(isLocalhostOrIPAddress('my-custom-rpc')).toBe(false);
  });
});
