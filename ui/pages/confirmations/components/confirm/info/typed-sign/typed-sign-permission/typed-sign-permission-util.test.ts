import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  useErc20TokenDetails,
  useNativeTokenLabel,
} from './typed-sign-permission-util';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('typed-sign-permission-util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useErc20TokenDetails', () => {
    const mockToken = {
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
    };

    const mockTokenWithSymbolOnly = {
      symbol: 'SYMBOL',
      decimals: 6,
    };

    const mockTokenWithNameOnly = {
      name: 'Name Only Token',
      decimals: 8,
    };

    beforeEach(() => {
      mockUseSelector.mockImplementation(() => mockToken);
    });

    it('returns token details with name and decimals', () => {
      const { result } = renderHook(() =>
        useErc20TokenDetails({
          tokenAddress: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
        }),
      );

      expect(result.current).toEqual({
        label: 'Test Token',
        decimals: 18,
      });
    });

    it('returns symbol when name is not available', () => {
      mockUseSelector.mockImplementation(() => mockTokenWithSymbolOnly);

      const { result } = renderHook(() =>
        useErc20TokenDetails({
          tokenAddress: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
        }),
      );

      expect(result.current).toEqual({
        label: 'SYMBOL',
        decimals: 6,
      });
    });

    it('returns name when symbol is not available', () => {
      mockUseSelector.mockImplementation(() => mockTokenWithNameOnly);

      const { result } = renderHook(() =>
        useErc20TokenDetails({
          tokenAddress: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
        }),
      );

      expect(result.current).toEqual({
        label: 'Name Only Token',
        decimals: 8,
      });
    });

    it('returns undefined values when token is not found', () => {
      mockUseSelector.mockImplementation(() => undefined);

      const { result } = renderHook(() =>
        useErc20TokenDetails({
          tokenAddress: '0x1234567890123456789012345678901234567890',
          chainId: '0x1',
        }),
      );

      expect(result.current).toEqual({
        label: undefined,
        decimals: undefined,
      });
    });

    it('calls selector with correct parameters', () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890';
      const chainId = '0x1';

      renderHook(() => useErc20TokenDetails({ tokenAddress, chainId }));

      expect(mockUseSelector).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('useNativeTokenLabel', () => {
    const mockNetworkConfig = {
      nativeCurrency: 'ETH',
    };

    beforeEach(() => {
      mockUseSelector.mockImplementation(() => mockNetworkConfig);
    });

    it('returns native currency symbol when available', () => {
      const { result } = renderHook(() => useNativeTokenLabel('0x1'));

      expect(result.current).toEqual('ETH');
    });

    it('returns "NATIVE" when network config is not found', () => {
      mockUseSelector.mockImplementation(() => undefined);

      const { result } = renderHook(() => useNativeTokenLabel('0x999'));

      expect(result.current).toEqual('NATIVE');
    });

    it('calls selector with correct parameters', () => {
      const chainId = '0x1';

      renderHook(() => useNativeTokenLabel(chainId));

      expect(mockUseSelector).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
