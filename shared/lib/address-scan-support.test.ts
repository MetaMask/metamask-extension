import { isAddressScanSupportedChainId } from './address-scan-support';

describe('isAddressScanSupportedChainId', () => {
  it('returns true for Ethereum mainnet', () => {
    expect(isAddressScanSupportedChainId('0x1')).toBe(true);
  });

  it('matches chain IDs case-insensitively', () => {
    expect(isAddressScanSupportedChainId('0X1')).toBe(true);
  });

  it('returns true for Robinhood (in the controller address-scan list)', () => {
    expect(isAddressScanSupportedChainId('0x1237')).toBe(true);
  });

  it('returns false for an unknown chain', () => {
    expect(isAddressScanSupportedChainId('0xdeadbeef')).toBe(false);
  });

  it('returns false for Celo (7702-supported, not address-scan supported)', () => {
    expect(isAddressScanSupportedChainId('0xa4ec')).toBe(false);
  });

  it('returns false for Immutable zkEVM (mapped, but not address-scan supported)', () => {
    expect(isAddressScanSupportedChainId('0x343b')).toBe(false);
  });

  it('returns false when chainId is undefined', () => {
    expect(isAddressScanSupportedChainId(undefined)).toBe(false);
  });
});
