import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RegistryNetworkConfig } from '@metamask/config-registry-controller';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../shared/constants/multichain/networks';
import {
  buildNetworkImageUrls,
  buildNativeTokenImageUrls,
  useConfigRegistryNetworks,
} from './useConfigRegistryNetworks';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      metamask: {
        remoteFeatureFlags: { configRegistryApiEnabled: true },
      },
    }),
}));

const mockFetch = jest.fn();
jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) => mockFetch(...args),
}));

const registryNetwork = (
  overrides: Partial<RegistryNetworkConfig> = {},
): RegistryNetworkConfig =>
  ({
    chainId: 'eip155:99901',
    name: 'Elysium Mainnet',
    imageUrl: 'https://example.com/elysium.svg',
    coingeckoPlatformId: 'elysium-kinetiq',
    assets: {
      native: {
        assetId: 'eip155:99901/slip44:2457',
        imageUrl: 'https://example.com/native.png',
        name: 'HYPE',
        symbol: 'HYPE',
        decimals: 18,
      },
    },
    rpcProviders: {
      default: {
        url: 'https://rpc.elysium.kinetiq.xyz',
        type: 'custom',
        networkClientId: 'elysium-mainnet',
      },
      fallbacks: [],
    },
    blockExplorerUrls: {
      default: 'https://elysium.kinetiq.xyz/explorer',
      fallbacks: [],
    },
    config: {
      isActive: true,
      isTestnet: false,
      isDefault: false,
      isFeatured: false,
      isDeprecated: false,
      isDeletable: true,
      priority: 3,
    },
    ...overrides,
  }) as RegistryNetworkConfig;

describe('buildNetworkImageUrls', () => {
  it('returns the static maps when disabled or networks are missing', () => {
    expect(buildNetworkImageUrls(undefined, true)).toEqual({
      ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
      ...MULTICHAIN_TOKEN_IMAGE_MAP,
    });
    expect(buildNetworkImageUrls({}, false)).toEqual({
      ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
      ...MULTICHAIN_TOKEN_IMAGE_MAP,
    });
  });

  it('layers registry image URLs over the static maps keyed by hex and CAIP-2 chain ID', () => {
    const result = buildNetworkImageUrls(
      {
        'eip155:99901': registryNetwork(),
        'eip155:9999': registryNetwork({
          chainId: 'eip155:9999',
          imageUrl: 'http://insecure.example.com/x.svg',
        }),
      },
      true,
    );
    expect(result['0x1863d']).toBe('https://example.com/elysium.svg');
    expect(result['eip155:99901']).toBe('https://example.com/elysium.svg');
    expect(result['0x270f']).toBeUndefined();
    expect(result['0x1']).toBe(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1']);
  });
});

describe('buildNativeTokenImageUrls', () => {
  it('returns the static token map when disabled or networks are missing', () => {
    expect(buildNativeTokenImageUrls(undefined, true)).toBe(
      CHAIN_ID_TOKEN_IMAGE_MAP,
    );
  });

  it('layers registry assets.native image URLs over the static token map', () => {
    const result = buildNativeTokenImageUrls(
      { 'eip155:99901': registryNetwork() },
      true,
    );
    expect(result['0x1863d']).toBe('https://example.com/native.png');
    expect(result['0x1']).toBe(CHAIN_ID_TOKEN_IMAGE_MAP['0x1']);
  });
});

describe('useConfigRegistryNetworks', () => {
  it('fetches registry networks via the background messenger and builds the maps', async () => {
    mockFetch.mockResolvedValue({
      configs: { networks: { 'eip155:99901': registryNetwork() } },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useConfigRegistryNetworks(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() =>
      expect(result.current.networkImageUrls['0x1863d']).toBe(
        'https://example.com/elysium.svg',
      ),
    );
    expect(mockFetch).toHaveBeenCalledWith('ConfigRegistryController:getState');
    expect(result.current.nativeTokenImageUrls['0x1863d']).toBe(
      'https://example.com/native.png',
    );
  });

  it('falls back to the static maps when the background call fails', async () => {
    mockFetch.mockRejectedValue(new Error('no background connection'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(() => useConfigRegistryNetworks(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() =>
      expect(result.current.networkImageUrls['0x1']).toBe(
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1'],
      ),
    );
    expect(result.current.networkImageUrls['0x270f']).toBeUndefined();
  });
});
