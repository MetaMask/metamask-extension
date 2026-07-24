import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getGasFeesSponsoredNetworkEnabled } from '../selectors';
import { useIsHardwareWalletAccount } from './useIsHardwareWalletAccount';
import { useIsNetworkGasSponsored } from './useIsNetworkGasSponsored';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getGasFeesSponsoredNetworkEnabled: jest.fn(),
}));

jest.mock('./useIsHardwareWalletAccount');

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseIsHardwareWalletAccount = jest.mocked(useIsHardwareWalletAccount);

const renderWithMock = ({
  chainId,
  mockIsHardwareWalletAccount = false,
  mockGasFeesSponsoredNetworkEnabled = {
    '0x1': true,
    '0x2': false,
  },
}: {
  chainId: string | undefined;
  mockIsHardwareWalletAccount?: boolean;
  mockGasFeesSponsoredNetworkEnabled?: { [key: string]: boolean };
}) => {
  mockUseIsHardwareWalletAccount.mockReturnValue(mockIsHardwareWalletAccount);
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getGasFeesSponsoredNetworkEnabled) {
      return mockGasFeesSponsoredNetworkEnabled;
    }
  });
  return renderHook(() => useIsNetworkGasSponsored(chainId));
};

describe('useIsNetworkGasSponsored', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('returns true when network is enabled using hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x1' });
    expect(result.current).toEqual({ isNetworkGasSponsored: true });
  });

  it('returns false when network is disabled using hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x2' });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns false when network is missing from flag using hex chainId', () => {
    const { result } = renderWithMock({ chainId: '0x3' });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns true when network is enabled using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:1' });
    expect(result.current).toEqual({ isNetworkGasSponsored: true });
  });

  it('returns false when network is disabled using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:2' });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns false when network is missing from flag using CAIP chainId', () => {
    const { result } = renderWithMock({ chainId: 'eip155:3' });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns false when network is enabled using hex chainId BUT is hardware wallet', () => {
    const { result } = renderWithMock({
      chainId: '0x1',
      mockIsHardwareWalletAccount: true,
    });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns false when network is enabled using CAIP chainId BUT is hardware wallet', () => {
    const { result } = renderWithMock({
      chainId: 'eip155:1',
      mockIsHardwareWalletAccount: true,
    });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });
});
