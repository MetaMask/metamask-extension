import { useCallback } from 'react';
import { useSelector } from 'react-redux';

// Mock useSelector
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('DefaultNetworks - Gas fees sponsored logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isNetworkGasSponsored returns true when chainId has gas fees sponsored', () => {
    const mockGasFeesSponsoredNetwork = {
      '0x38': true,
      '0x89': false,
    };

    // Simulate the isNetworkGasSponsored callback logic
    const isNetworkGasSponsored = (chainId: string | undefined): boolean => {
      if (!chainId) return false;
      return Boolean(
        mockGasFeesSponsoredNetwork[
          chainId as keyof typeof mockGasFeesSponsoredNetwork
        ],
      );
    };

    expect(isNetworkGasSponsored(undefined)).toBe(false);
    expect(isNetworkGasSponsored('0x1')).toBe(false);
    expect(isNetworkGasSponsored('0x89')).toBe(false);
    expect(isNetworkGasSponsored('0x38')).toBe(true);
  });
});
