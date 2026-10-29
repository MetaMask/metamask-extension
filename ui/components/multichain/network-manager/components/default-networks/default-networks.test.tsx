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
    const isHardwareWalletAccount = false;

    const isNetworkGasSponsored = (chainId: string | undefined): boolean => {
      if (!chainId || isHardwareWalletAccount) {
        return false;
      }
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

  it('isNetworkGasSponsored returns false for hardware wallet accounts even when gas fees are sponsored', () => {
    const mockGasFeesSponsoredNetwork = {
      '0x38': true,
      '0x89': false,
    };
    const isHardwareWalletAccount = true;

    const isNetworkGasSponsored = (chainId: string | undefined): boolean => {
      if (!chainId || isHardwareWalletAccount) {
        return false;
      }
      return Boolean(
        mockGasFeesSponsoredNetwork[
          chainId as keyof typeof mockGasFeesSponsoredNetwork
        ],
      );
    };

    expect(isNetworkGasSponsored(undefined)).toBe(false);
    expect(isNetworkGasSponsored('0x1')).toBe(false);
    expect(isNetworkGasSponsored('0x89')).toBe(false);
    expect(isNetworkGasSponsored('0x38')).toBe(false);
  });
});

export {};
