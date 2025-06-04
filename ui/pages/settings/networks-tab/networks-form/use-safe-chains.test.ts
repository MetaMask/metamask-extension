import * as FetchWithCacheModule from '../../../../../shared/lib/fetch-with-cache';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers';
import {
  rpcIdentifierUtility,
  SafeChain,
  useSafeChains,
} from './use-safe-chains';

describe('rpcIdentifierUtility', () => {
  let safeChains: SafeChain[];

  beforeEach(() => {
    safeChains = [
      {
        chainId: '1',
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpc: ['https://example.com/rpc', 'https://another-example.com/rpc'],
      },
      {
        chainId: '2',
        name: 'Another Chain',
        nativeCurrency: { symbol: 'ANC' },
        rpc: ['https://known-rpc.com', 'https://rpc.example.com'],
      },
    ];
  });

  it('should return the host if the rpcUrl host is known', () => {
    const rpcUrl = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" if the rpcUrl host is not in safeChains', () => {
    const rpcUrl = 'https://unknown.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('Unknown rpcUrl');
  });

  it('should sanitize rpcUrls by removing placeholders and compare by host', () => {
    const rpcUrlWithEnvVar = 'https://example.com/rpc/{API_KEY}';
    const result = rpcIdentifierUtility(rpcUrlWithEnvVar, safeChains);
    expect(result).toBe('example.com');
  });

  it('should correctly identify rpcUrls by host even with special characters', () => {
    safeChains.push({
      chainId: '3',
      name: 'Special Chain',
      nativeCurrency: { symbol: 'SPC' },
      rpc: ['https://example.com/rpc?token=1234'],
    });
    const rpcUrlWithSpecialChar = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlWithSpecialChar, safeChains);
    expect(result).toBe('example.com');
  });

  it('should handle cases where rpcUrls contain mixed case characters', () => {
    safeChains.push({
      chainId: '4',
      name: 'Mixed Case Chain',
      nativeCurrency: { symbol: 'MCC' },
      rpc: ['https://Example.com/rpc'],
    });
    const rpcUrlMixedCase = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlMixedCase, safeChains);
    expect(result).toBe('example.com');
  });

  it('should handle rpcUrls with trailing slashes', () => {
    const rpcUrlWithTrailingSlash = 'https://example.com/rpc/';
    const rpcUrlWithoutTrailingSlash = 'https://example.com/rpc';
    const resultWithSlash = rpcIdentifierUtility(
      rpcUrlWithTrailingSlash,
      safeChains,
    );
    const resultWithoutSlash = rpcIdentifierUtility(
      rpcUrlWithoutTrailingSlash,
      safeChains,
    );

    expect(resultWithSlash).toBe('example.com');
    expect(resultWithoutSlash).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" for unknown rpcUrls with trailing slashes', () => {
    const rpcUrl = 'https://unknown.com/rpc/';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('Unknown rpcUrl');
  });
});

describe('useSafeChains', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const arrange = () => {
    const mockSafeChain: SafeChain = {
      chainId: '1',
      name: 'Ethereum Mainnet',
      nativeCurrency: {
        symbol: 'ETH',
      },
      rpc: ['https://mainnet.infura.io/v3/'],
    };

    const mockFetchWithCache = jest
      .spyOn(FetchWithCacheModule, 'default')
      .mockResolvedValue([mockSafeChain]);
    const mockState = {
      metamask: {
        useSafeChainsListValidation: true,
      },
    };

    return { mockFetchWithCache, mockState, mockSafeChain };
  };

  type Arrange = ReturnType<typeof arrange>;
  const arrangeAct = (override?: (a: Arrange) => void) => {
    const arrangeMocks = arrange();
    override?.(arrangeMocks);

    const hook = renderHookWithProviderTyped(
      () => useSafeChains(),
      arrangeMocks.mockState,
    );

    return {
      ...arrangeMocks,
      ...hook,
    };
  };

  it('fetches safe chains when useSafeChainsListValidation is enabled', async () => {
    const { result, mockFetchWithCache, waitFor } = arrangeAct();

    await waitFor(() => expect(result.current.safeChains).toHaveLength(1));
    expect(mockFetchWithCache).toHaveBeenCalled();
  });

  it('does not fetch safe chains when useSafeChainsListValidation is disabled', async () => {
    const { result, mockFetchWithCache } = arrangeAct((mocks) => {
      mocks.mockState.metamask.useSafeChainsListValidation = false;
    });

    expect(result.current.safeChains).toHaveLength(0);
    expect(mockFetchWithCache).not.toHaveBeenCalled();
  });

  it('returns an error result when fetching fails', async () => {
    const { result, mockFetchWithCache, waitFor } = arrangeAct((mocks) => {
      mocks.mockFetchWithCache.mockRejectedValue(new Error('MOCK ERROR'));
    });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.safeChains).toBeUndefined();
    expect(mockFetchWithCache).toHaveBeenCalled();
  });
});
