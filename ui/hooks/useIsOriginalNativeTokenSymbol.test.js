import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import * as fetchWithCacheModule from '../../shared/lib/fetch-with-cache';
import { useSafeChainsListValidationSelector } from '../selectors';
import { useIsOriginalNativeTokenSymbol } from './useIsOriginalNativeTokenSymbol'; // Adjust the import path accordingly

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const generateUseSelectorRouter = (opts) => (selector) => {
  if (selector === useSafeChainsListValidationSelector) {
    return opts;
  }
  return undefined;
};

describe('useNativeTokenFiatAmount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the correct value when the native symbol matches the ticker', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
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
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x1', 'ETH', 'mainnet'),
      );
    });

    // Expect the hook to return true when the native symbol matches the ticker
    expect(result.result.current).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled();
  });

  it('should return the correct value when the native symbol does not match the ticker', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
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
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x13a', 'FIL', 'mainnet'),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(false);
    expect(spyFetch).toHaveBeenCalled();
  });

  it('should return false if fetch chain list throw an error', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the fetchWithCache function to throw an error
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockImplementation(() => {
        throw new Error('error');
      });

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x13a', 'FIL', 'mainnet'),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(false);
    expect(spyFetch).toHaveBeenCalled();
  });

  it('should return the correct value when the chainId is in the CHAIN_ID_TO_CURRENCY_SYMBOL_MAP', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));

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
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x5', 'GoerliETH', 'goerli'),
      );
    });
    // expect this to pass because the chainId is in the CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
    expect(result.result.current).toBe(true);
    // expect that the chainlist API was not called
    expect(spyFetch).not.toHaveBeenCalled();
  });

  it('should return the correct value when the chainId is not in the CHAIN_ID_TO_CURRENCY_SYMBOL_MAP', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the safeChainsList response
    const safeChainsList = [
      {
        chainId: 314,
        nativeCurrency: {
          symbol: 'FIL',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x13a', 'FIL', 'mainnet'),
      );
    });

    // Expect the hook to return true when the native symbol matches the ticker
    expect(result.result.current).toBe(true);
    // Expect the chainslist API to have been called
    expect(spyFetch).toHaveBeenCalled();
  });

  it('should return true if chain safe validation is disabled', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(false));
    // Mock the safeChainsList response with a different native symbol
    const safeChainsList = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol('0x1', 'GoerliETH', 'goerli'),
      );
    });

    expect(result.result.current).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled();
  });

  it('should return false if rpcUrl is localhost', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the fetchWithCache function to throw an error
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockImplementation(() => {
        throw new Error('error');
      });

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol(
          '0x13a',
          'FIL',
          'mainnet',
          'http://localhost:8545',
        ),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled();
  });

  it('should not return false for collision network', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the fetchWithCache function to throw an error
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockImplementation(() => {
        throw new Error('error');
      });

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol(
          '0x4e',
          'ZYN',
          'mainnet',
          'https://rpc.wethio.io',
        ),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled();
  });

  it('should return false for collision network with wrong symbol', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the safeChainsList response
    const safeChainsList = [
      {
        chainId: 78,
        nativeCurrency: {
          symbol: 'PETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol(
          '0x4e',
          'TEST',
          'mainnet',
          'https://rpc.wethio.io',
        ),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(false);
    expect(spyFetch).toHaveBeenCalled();
  });

  it('should return true for collision network with correct symbol', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the safeChainsList response
    const safeChainsList = [
      {
        chainId: 78,
        nativeCurrency: {
          symbol: 'PETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    let result;

    await act(async () => {
      result = renderHook(() =>
        useIsOriginalNativeTokenSymbol(
          '0x4e',
          'PETH',
          'mainnet',
          'https://rpc.wethio.io',
        ),
      );
    });

    // Expect the hook to return false when the native symbol does not match the ticker
    expect(result.result.current).toBe(true);
    expect(spyFetch).toHaveBeenCalled();
  });
});
