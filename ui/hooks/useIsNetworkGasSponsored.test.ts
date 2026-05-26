import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  getGasFeesSponsoredNetworkEnabled,
  isHardwareWallet,
} from '../selectors';
import { useIsNetworkGasSponsored } from './useIsNetworkGasSponsored';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getGasFeesSponsoredNetworkEnabled: jest.fn(),
  isHardwareWallet: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const renderWithMock = ({
  chainId,
  mockIsHardwareWallet = false,
  mockGasFeesSponsoredNetworkEnabled = {
    '0x1': true,
    '0x2': false,
  },
}: {
  chainId: string | undefined;
  mockIsHardwareWallet?: boolean;
  mockGasFeesSponsoredNetworkEnabled?: { [key: string]: boolean };
}) => {
  mockUseSelector.mockImplementation((selector) => {
    if (selector === isHardwareWallet) {
      return mockIsHardwareWallet;
    }
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
      mockIsHardwareWallet: true,
    });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });

  it('returns false when network is enabled using CAIP chainId BUT is hardware wallet', () => {
    const { result } = renderWithMock({
      chainId: 'eip155:1',
      mockIsHardwareWallet: true,
    });
    expect(result.current).toEqual({ isNetworkGasSponsored: false });
  });
});
