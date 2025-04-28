import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import * as fetchWithCacheModule from '../../shared/lib/fetch-with-cache';
import * as wellKnownCacheModule from '../../shared/modules/well-known-chains';
import { useExternalWellKnownChainsValidationSelector } from '../selectors';
import { getMultichainIsEvm } from '../selectors/multichain';
import { useIsOriginalNativeTokenSymbol } from './useIsOriginalNativeTokenSymbol'; // Adjust the import path accordingly

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const generateUseSelectorRouter = (opts) => (selector) => {
  if (selector === getMultichainIsEvm) {
    // If we consider testing non-EVM here, we would need to also mock those:
    // - getMultichainCurrentNetwork
    return true;
  }
  if (selector === useExternalWellKnownChainsValidationSelector) {
    return opts;
  }
  return undefined;
};

describe('useIsOriginalNativeTokenSymbol', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the correct value when the native symbol matches the ticker', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(true));
    // Mock the wellKnownChains response
    const wellKnownChains = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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
    // Mock the wellKnownChains response with a different native symbol
    const wellKnownChains = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'BTC',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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

    // Mock the wellKnownChains response with a different native symbol
    const wellKnownChains = [
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'BTC',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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
    // Mock the wellKnownChains response
    const wellKnownChains = [
      {
        chainId: 314,
        nativeCurrency: {
          symbol: 'FIL',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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

  it('should only use the internal cache if fetching the external well-known list is disabled', async () => {
    useSelector.mockImplementation(generateUseSelectorRouter(false));
    // Mock the wellKnownChains response with a different native symbol
    const externalWellKnownChains = [
      // this list doesn't contain the tests "CrAzYeTh" symbol, so if it
      // were used it would return `false`
      {
        chainId: 1,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ];

    const internalWellKnownChains = [
      {
        chainId: 0,
        nativeCurrency: {
          symbol: 'CrAzYeTh',
        },
      },
    ];

    // Mock the fetchWithCache function to return the externalWellKnownChains.
    // this should NOT be called (tested for below)
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(externalWellKnownChains);

    // Mock the getWellKnownChains function to return the
    // internalWellKnownChains.
    // this *should* be called (tested for below)
    const spyCache = jest
      .spyOn(wellKnownCacheModule, 'getWellKnownChains')
      .mockResolvedValue(internalWellKnownChains);

    let result;

    await act(async () => {
      result = renderHook(() =>
        // 0x0000000000 is invalid. It is used just so we don't ever end up with
        // a collision with some other valid future ChainID
        useIsOriginalNativeTokenSymbol('0x0000000000', 'CrAzYeTh', 'CrAzYChAiN'),
      );
    });

    expect(result.result.current).toBe(true);
    expect(spyFetch).not.toHaveBeenCalled();
    expect(spyCache).toHaveBeenCalled();
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
    // Mock the wellKnownChains response
    const wellKnownChains = [
      {
        chainId: 78,
        nativeCurrency: {
          symbol: 'PETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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
    // Mock the wellKnownChains response
    const wellKnownChains = [
      {
        chainId: 78,
        nativeCurrency: {
          symbol: 'PETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the wellKnownChains
    const spyFetch = jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(wellKnownChains);

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
