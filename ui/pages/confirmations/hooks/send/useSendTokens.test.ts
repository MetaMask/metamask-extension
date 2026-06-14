import { useSelector } from 'react-redux';
import { waitFor } from '@testing-library/react';
import type { Hex } from '@metamask/utils';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsBySelectedAccountGroupIncludingHidden,
} from '../../../../selectors/assets';
import { getIsTokenManagementFilterEnabled } from '../../../../selectors/multichain/feature-flags';
import * as useFiatFormatterModule from '../../../../hooks/useFiatFormatter';
import { AssetStandard, type Asset } from '../../types/send';
import * as useChainNetworkNameAndImageModule from '../useChainNetworkNameAndImage';
import * as assetUtils from '../../../../../shared/lib/asset-utils';
import { useSendTokens } from './useSendTokens';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../useChainNetworkNameAndImage');
jest.mock('../../../../hooks/useFiatFormatter');
jest.mock('../../../../../shared/lib/asset-utils', () => ({
  ...jest.requireActual('../../../../../shared/lib/asset-utils'),
  fetchAssetMetadataForAssetIds: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseChainNetworkNameAndImageMap = jest.mocked(
  useChainNetworkNameAndImageModule.useChainNetworkNameAndImageMap,
);
const mockUseFiatFormatter = jest.mocked(
  useFiatFormatterModule.useFiatFormatter,
);
const mockFetchAssetMetadataForAssetIds = jest.mocked(
  assetUtils.fetchAssetMetadataForAssetIds,
);

describe('useSendTokens', () => {
  const mockAssetsData = [
    {
      address: '0xNativeEth',
      chainId: '0x1',
      balance: '1000000000000000000',
      rawBalance: '0xde0b6b3a7640000',
      isNative: true,
      symbol: 'ETH',
      decimals: 18,
      fiat: {
        balance: 2000,
        currency: 'USD',
      },
    },
    {
      address: '0xUSDC',
      chainId: '0x1',
      balance: '500000000',
      rawBalance: '0x1dcd6500',
      isNative: false,
      symbol: 'USDC',
      decimals: 6,
      image: 'usdc.png',
      fiat: {
        balance: 500,
        currency: 'USD',
      },
    },
    {
      address: '0xTestToken',
      chainId: '0x5',
      balance: '1000000000000000000',
      rawBalance: '0xde0b6b3a7640000',
      isNative: false,
      symbol: 'TEST',
      decimals: 18,
      fiat: {
        balance: 0,
        currency: 'USD',
      },
    },
    {
      address: '0xZeroBalance',
      chainId: '0x1',
      balance: '0',
      rawBalance: '0x0',
      isNative: false,
      symbol: 'ZERO',
      decimals: 18,
      fiat: {
        balance: 0,
        currency: 'USD',
      },
    },
  ];

  const mockChainNetworkMap = new Map([
    ['0x1', { networkName: 'Ethereum', networkImage: 'eth.svg' }],
    ['0x5', { networkName: 'Goerli', networkImage: 'goerli.svg' }],
  ]);

  const mockFormatter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getIsTokenManagementFilterEnabled) {
        return false;
      }
      if (selector === getAssetsBySelectedAccountGroup) {
        return mockAssetsData;
      }
      return undefined;
    });

    mockUseChainNetworkNameAndImageMap.mockReturnValue(mockChainNetworkMap);
    mockUseFiatFormatter.mockReturnValue(mockFormatter);
    mockFormatter.mockReturnValue('$1,000.00');
    mockFetchAssetMetadataForAssetIds.mockResolvedValue({});
  });

  it('includes testnet assets with non-zero raw balance', async () => {
    const testNetAssetData = [
      {
        address: '0xTestToken',
        chainId: '0xaa36a7',
        balance: '1000000000000000000',
        rawBalance: '0xde0b6b3a7640000',
        isNative: false,
        symbol: 'TEST',
        decimals: 18,
        fiat: {
          balance: 0,
          currency: 'USD',
        },
      },
    ];

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return testNetAssetData;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const testNetAsset = result.current.find(
      (asset: Asset) => asset.symbol === 'TEST',
    );
    expect(testNetAsset).toBeDefined();
    expect(testNetAsset?.chainId).toBe('0xaa36a7');
  });

  it('excludes assets with zero balance and zero fiat by default', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const zeroBalanceAsset = result.current.find(
      (asset: Asset) => asset.symbol === 'ZERO',
    );
    expect(zeroBalanceAsset).toBeUndefined();
  });

  it('includes assets with zero balance when includeNoBalance is true', async () => {
    const { result } = renderHookWithProvider(
      () => useSendTokens({ includeNoBalance: true }),
      mockState,
    );

    const zeroBalanceAsset = result.current.find(
      (asset: Asset) => asset.symbol === 'ZERO',
    );
    expect(zeroBalanceAsset).toBeDefined();
  });

  it('uses hidden-inclusive assets when the token management flag is enabled', async () => {
    const hiddenAsset = {
      address: '0xHiddenToken',
      chainId: '0x1',
      balance: '1000000000000000000',
      rawBalance: '0xde0b6b3a7640000',
      isNative: false,
      symbol: 'HIDDEN',
      decimals: 18,
      fiat: {
        balance: 100,
        currency: 'USD',
      },
    };

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getIsTokenManagementFilterEnabled) {
        return true;
      }
      if (selector === getAssetsBySelectedAccountGroupIncludingHidden) {
        return [hiddenAsset];
      }
      if (selector === getAssetsBySelectedAccountGroup) {
        return [];
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current).toHaveLength(1);
    expect(result.current[0].symbol).toBe('HIDDEN');
  });

  it('filters tokens by chain ID and address when tokenFilter is provided', async () => {
    const { result } = renderHookWithProvider(
      () =>
        useSendTokens({
          includeNoBalance: true,
          tokenFilter: (chainId, address) =>
            chainId === '0x1' && address.toLowerCase() === '0xusdc',
        }),
      mockState,
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].symbol).toBe('USDC');
  });

  it('enriches allowlisted tokens that are not in the wallet asset list', async () => {
    const enrichedAddress = '0x1111111111111111111111111111111111111111';
    const enrichedChainId = '0x1' as Hex;
    const enrichedAssetId = assetUtils.toAssetId(
      enrichedAddress,
      enrichedChainId,
    );

    mockFetchAssetMetadataForAssetIds.mockResolvedValue({
      [enrichedAssetId as string]: {
        assetId: enrichedAssetId,
        decimals: 18,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
      },
    } as never);

    const { result } = renderHookWithProvider(
      () =>
        useSendTokens({
          enrichTokenRequests: [
            {
              address: enrichedAddress,
              chainId: enrichedChainId,
            },
          ],
          includeNoBalance: true,
        }),
      mockState,
    );

    await waitFor(() => {
      expect(
        result.current.find(
          (asset: Asset) => asset.address === enrichedAddress,
        ),
      ).toBeDefined();
    });

    const enrichedAsset = result.current.find(
      (asset: Asset) => asset.address === enrichedAddress,
    );
    expect(enrichedAsset?.symbol).toBe('DAI');
    expect(enrichedAsset?.rawBalance).toBe('0x0');
  });

  it('handles metadata enrichment aborts without rejecting', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    mockFetchAssetMetadataForAssetIds.mockRejectedValueOnce(abortError);

    const { result } = renderHookWithProvider(
      () =>
        useSendTokens({
          enrichTokenRequests: [
            {
              address: '0x1111111111111111111111111111111111111111',
              chainId: '0x1',
            },
          ],
          includeNoBalance: true,
        }),
      mockState,
    );

    await waitFor(() => {
      expect(mockFetchAssetMetadataForAssetIds).toHaveBeenCalled();
    });

    expect(result.current.some((asset: Asset) => asset.symbol === 'DAI')).toBe(
      false,
    );
  });

  it('sorts assets by fiat balance descending', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current[0].fiat?.balance).toBe(2000);
    expect(result.current[1].fiat?.balance).toBe(500);
  });

  it('sets correct standard for native tokens', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const nativeToken = result.current.find((asset: Asset) => asset.isNative);
    expect(nativeToken?.standard).toBe(AssetStandard.Native);
  });

  it('sets correct standard for ERC20 tokens', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const erc20Token = result.current.find((asset: Asset) => !asset.isNative);
    expect(erc20Token?.standard).toBe(AssetStandard.ERC20);
  });

  it('adds network information when available', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const ethereumAsset = result.current.find(
      (asset: Asset) => asset.chainId === '0x1',
    );
    expect(ethereumAsset?.networkName).toBe('Ethereum');
    expect(ethereumAsset?.networkImage).toBe('eth.svg');
  });

  it('handles missing network information gracefully', async () => {
    const emptyChainMap = new Map();
    mockUseChainNetworkNameAndImageMap.mockReturnValue(emptyChainMap);

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const asset = result.current[0];
    expect(asset?.networkName).toBeUndefined();
    expect(asset?.networkImage).toBeUndefined();
  });

  it('uses native token image for native assets', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const nativeAsset = result.current.find((asset: Asset) => asset.isNative);
    expect(nativeAsset?.image).toBeDefined();
  });

  it('preserves original image for non-native assets', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const usdcAsset = result.current.find(
      (asset: Asset) => asset.symbol === 'USDC',
    );
    expect(usdcAsset?.image).toBe('usdc.png');
  });

  it('returns empty array when no assets exist', async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return [];
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current).toEqual([]);
  });

  it('updates when dependencies change', async () => {
    const { result, rerender } = renderHookWithProvider(
      () => useSendTokens(),
      mockState,
    );

    expect(result.current).toHaveLength(3);

    const newAssetsData = [
      {
        address: '0xNewToken',
        chainId: '0x1',
        balance: '2000000000000000000',
        rawBalance: '0x1bc16d674ec80000',
        isNative: false,
        symbol: 'NEW',
        decimals: 18,
        fiat: {
          balance: 1000,
          currency: 'USD',
        },
      },
    ];

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return newAssetsData;
      }
      return undefined;
    });

    rerender();

    expect(result.current).toHaveLength(1);
    expect(result.current[0].symbol).toBe('NEW');
  });

  it('handles empty balance string gracefully', async () => {
    const assetsWithEmptyBalance = [
      {
        address: '0xToken',
        chainId: '0x5',
        balance: '',
        rawBalance: '0xde0b6b3a7640000',
        isNative: false,
        symbol: 'TOKEN',
        decimals: 18,
        fiat: {
          balance: 100,
          currency: 'USD',
        },
      },
    ];

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getAssetsBySelectedAccountGroup) {
        return assetsWithEmptyBalance;
      }
      return undefined;
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const asset = result.current[0];
    expect(asset?.shortenedBalance).toBe('');
  });
});
