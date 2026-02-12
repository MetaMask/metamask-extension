import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';

import * as TokenActions from '../utils/token';
import { useGetTokenStandardAndDetails } from './useGetTokenStandardAndDetails';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => 0x1,
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest
      .fn()
      .mockResolvedValue({ decimals: 2, standard: 'ERC20' }),
    getTokenStandardAndDetailsByChain: jest
      .fn()
      .mockResolvedValue({ decimals: 6, standard: 'ERC20' }),
  };
});

describe('useGetTokenStandardAndDetails', () => {
  it('should return token details', () => {
    const { result } = renderHook(() => useGetTokenStandardAndDetails('0x5'));
    expect(result.current).toEqual({ decimalsNumber: undefined });
  });

  it('should return token details obtained from getTokenStandardAndDetails action', async () => {
    jest
      .spyOn(TokenActions, 'memoizedGetTokenStandardAndDetails')
      .mockResolvedValue({
        standard: 'ERC20',
      } as TokenActions.TokenDetailsERC20);
    const { result, rerender } = renderHook(() =>
      useGetTokenStandardAndDetails('0x5'),
    );

    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({
        decimalsNumber: 18,
        standard: 'ERC20',
      });
    });
  });

  it('should use chain-aware lookup when chainId is provided', async () => {
    const mockChainDetails = {
      standard: 'ERC20',
      decimals: '6',
    } as TokenActions.TokenDetailsERC20;

    jest
      .spyOn(TokenActions, 'memoizedGetTokenStandardAndDetailsByChain')
      .mockResolvedValue(mockChainDetails);

    const { result, rerender } = renderHook(() =>
      useGetTokenStandardAndDetails('0x5', '0x38'),
    );

    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({
        ...mockChainDetails,
        decimalsNumber: 6,
      });
    });

    expect(
      TokenActions.memoizedGetTokenStandardAndDetailsByChain,
    ).toHaveBeenCalledWith('0x5', '0x38');
  });

  it('should return default decimals when chainId lookup returns no decimals', async () => {
    jest
      .spyOn(TokenActions, 'memoizedGetTokenStandardAndDetailsByChain')
      .mockResolvedValue({
        standard: 'ERC20',
      } as TokenActions.TokenDetailsERC20);

    const { result, rerender } = renderHook(() =>
      useGetTokenStandardAndDetails('0x5', '0x1'),
    );

    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({
        decimalsNumber: 18,
        standard: 'ERC20',
      });
    });
  });
});
