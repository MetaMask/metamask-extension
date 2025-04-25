import * as FetchWithCacheModule from '../../../../../shared/lib/fetch-with-cache';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers';
import {
  rpcIdentifierUtility,
  WellKnownChain,
  useWellKnownChains,
} from './use-well-known-chains';

describe('rpcIdentifierUtility', () => {
  let wellKnownChains: WellKnownChain[];

  beforeEach(() => {
    wellKnownChains = [
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpc: ['https://example.com/rpc', 'https://another-example.com/rpc'],
      },
      {
        chainId: 2,
        name: 'Another Chain',
        nativeCurrency: { symbol: 'ANC' },
        rpc: ['https://known-rpc.com', 'https://rpc.example.com'],
      },
    ];
  });

  it('should return the host if the rpcUrl host is known', () => {
    const rpcUrl = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, wellKnownChains);
    expect(result).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" if the rpcUrl host is not in wellKnownChains', () => {
    const rpcUrl = 'https://unknown.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, wellKnownChains);
    expect(result).toBe('Unknown rpcUrl');
  });

  it('should sanitize rpcUrls by removing placeholders and compare by host', () => {
    const rpcUrlWithEnvVar = 'https://example.com/rpc/{API_KEY}';
    const result = rpcIdentifierUtility(rpcUrlWithEnvVar, wellKnownChains);
    expect(result).toBe('example.com');
  });

  it('should correctly identify rpcUrls by host even with special characters', () => {
    wellKnownChains.push({
      chainId: 3,
      name: 'Special Chain',
      nativeCurrency: { symbol: 'SPC' },
      rpc: ['https://example.com/rpc?token=1234'],
    });
    const rpcUrlWithSpecialChar = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlWithSpecialChar, wellKnownChains);
    expect(result).toBe('example.com');
  });

  it('should handle cases where rpcUrls contain mixed case characters', () => {
    wellKnownChains.push({
      chainId: 4,
      name: 'Mixed Case Chain',
      nativeCurrency: { symbol: 'MCC' },
      rpc: ['https://Example.com/rpc'],
    });
    const rpcUrlMixedCase = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlMixedCase, wellKnownChains);
    expect(result).toBe('example.com');
  });

  it('should handle rpcUrls with trailing slashes', () => {
    const rpcUrlWithTrailingSlash = 'https://example.com/rpc/';
    const rpcUrlWithoutTrailingSlash = 'https://example.com/rpc';
    const resultWithSlash = rpcIdentifierUtility(
      rpcUrlWithTrailingSlash,
      wellKnownChains,
    );
    const resultWithoutSlash = rpcIdentifierUtility(
      rpcUrlWithoutTrailingSlash,
      wellKnownChains,
    );

    expect(resultWithSlash).toBe('example.com');
    expect(resultWithoutSlash).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" for unknown rpcUrls with trailing slashes', () => {
    const rpcUrl = 'https://unknown.com/rpc/';
    const result = rpcIdentifierUtility(rpcUrl, wellKnownChains);
    expect(result).toBe('Unknown rpcUrl');
  });
});

describe('useWellKnownChains', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const arrange = () => {
    const mockWellKnownChain: WellKnownChain = {
      chainId: 1,
      name: 'Ethereum Mainnet',
      nativeCurrency: {
        symbol: 'ETH',
      },
      rpc: ['https://mainnet.infura.io/v3/'],
    };

    const mockFetchWithCache = jest
      .spyOn(FetchWithCacheModule, 'default')
      .mockResolvedValue([mockWellKnownChain]);
    const mockState = {
      metamask: {
        useSafeChainsListValidation: true,
      },
    };

    return { mockFetchWithCache, mockState, mockWellKnownChain };
  };

  type Arrange = ReturnType<typeof arrange>;
  const arrangeAct = (override?: (a: Arrange) => void) => {
    const arrangeMocks = arrange();
    override?.(arrangeMocks);

    const hook = renderHookWithProviderTyped(
      () => useWellKnownChains(true),
      arrangeMocks.mockState,
    );

    return {
      ...arrangeMocks,
      ...hook,
    };
  };

  it('fetches external well-known chains when useSafeChainsListValidation is enabled', async () => {
    const { result, mockFetchWithCache, waitFor } = arrangeAct();

    await waitFor(() => expect(result.current.wellKnownChains).toHaveLength(1));
    expect(mockFetchWithCache).toHaveBeenCalled();
  });

  it('does not fetch external well-known chains when useSafeChainsListValidation is disabled', async () => {
    const { result, mockFetchWithCache } = arrangeAct((mocks) => {
      mocks.mockState.metamask.useSafeChainsListValidation = false;
    });

    expect(result.current.wellKnownChains).toHaveLength(0);
    expect(mockFetchWithCache).not.toHaveBeenCalled();
  });

  it('returns an error result when fetching fails', async () => {
    const { result, mockFetchWithCache, waitFor } = arrangeAct((mocks) => {
      mocks.mockFetchWithCache.mockRejectedValue(new Error('MOCK ERROR'));
    });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.wellKnownChains).toBeUndefined();
    expect(mockFetchWithCache).toHaveBeenCalled();
  });
});
