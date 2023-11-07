import { renderHook, act } from '@testing-library/react-hooks';
import * as fetchWithCacheModule from '../../shared/lib/fetch-with-cache';
import { useIsOriginalNativeTokenSymbol } from './useIsOriginalNativeTokenSymbol'; // Adjust the import path accordingly

describe('useNativeTokenFiatAmount', () => {
  it('should return the correct value when the native symbol matches the ticker', async () => {
    // Mock the safeChainsList response
    const safeChainsList = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() => useIsOriginalNativeTokenSymbol('0x1', 'ETH'));
    });

    // Expect the hook to return true when the native symbol matches the ticker
    expect(result.result.current).toBe(true);
  });

  it('should return the correct value when the native symbol does not match the ticker', async () => {
    // Mock the safeChainsList response with a different native symbol
    const safeChainsList = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'BTC',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() => useIsOriginalNativeTokenSymbol('0x1', 'ETH'));
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(false);
  });
});
