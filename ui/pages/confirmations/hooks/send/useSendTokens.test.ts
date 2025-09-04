import { useSelector } from 'react-redux';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import * as useFiatFormatterModule from '../../../../hooks/useFiatFormatter';
import { AssetStandard, type Asset } from '../../types/send';
import * as useChainNetworkNameAndImageModule from '../useChainNetworkNameAndImage';
import { useSendTokens } from './useSendTokens';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../useChainNetworkNameAndImage');
jest.mock('../../../../hooks/useFiatFormatter');

const mockUseSelector = jest.mocked(useSelector);
const mockUseChainNetworkNameAndImageMap = jest.mocked(
  useChainNetworkNameAndImageModule.useChainNetworkNameAndImageMap,
);
const mockUseFiatFormatter = jest.mocked(
  useFiatFormatterModule.useFiatFormatter,
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
      if (selector === getAssetsBySelectedAccountGroup) {
        return mockAssetsData;
      }
      return undefined;
    });

    mockUseChainNetworkNameAndImageMap.mockReturnValue(mockChainNetworkMap);
    mockUseFiatFormatter.mockReturnValue(mockFormatter);
    mockFormatter.mockReturnValue('$1,000.00');
  });

  it('returns tokens with positive fiat balance', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current).toHaveLength(2);
    expect(result.current[0].symbol).toBe('ETH');
    expect(result.current[1].symbol).toBe('USDC');
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

  it('excludes assets with zero balance and zero fiat', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const zeroBalanceAsset = result.current.find(
      (asset: Asset) => asset.symbol === 'ZERO',
    );
    expect(zeroBalanceAsset).toBeUndefined();
  });

  it('sorts assets by fiat balance descending', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current[0].fiat?.balance).toBe(2000);
    expect(result.current[1].fiat?.balance).toBe(500);
  });

  it('adds formatted balance in selected currency', async () => {
    mockFormatter.mockReturnValue('$2,000.00');

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(mockFormatter).toHaveBeenCalledWith(2000, { shorten: true });
    expect(result.current[0].balanceInSelectedCurrency).toBe('$2,000.00');
  });

  it('handles formatter error gracefully', async () => {
    mockFormatter.mockImplementation(() => {
      throw new Error('Formatter error');
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    expect(result.current[0].balanceInSelectedCurrency).toBe('2000 USD');
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

  it('adds shortened balance property', async () => {
    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const asset = result.current[0];
    expect(asset.shortenedBalance).toBe('10000');
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

  it('handles assets without fiat data', async () => {
    const assetsWithoutFiat = [
      {
        address: '0xToken',
        chainId: '0x5',
        balance: '1000000000000000000',
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
        return assetsWithoutFiat;
      }
      return undefined;
    });

    mockFormatter.mockImplementation(() => {
      throw new Error('Formatter error');
    });

    const { result } = renderHookWithProvider(() => useSendTokens(), mockState);

    const asset = result.current[0];
    expect(asset?.balanceInSelectedCurrency).toBe('100 USD');
  });

  it('updates when dependencies change', async () => {
    const { result, rerender } = renderHookWithProvider(
      () => useSendTokens(),
      mockState,
    );

    expect(result.current).toHaveLength(2);

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
