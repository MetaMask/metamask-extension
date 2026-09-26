/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetType } from '@metamask/bridge-controller';
import { EthScope, SolScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { apiClient } from '../../../helpers/api-client';
import { Asset } from '../types/asset';
import { useCurrentPrice } from './useCurrentPrice';

jest.mock('../../../helpers/api-client', () => ({
  apiClient: {
    prices: {
      getV3SpotPricesQueryOptions: jest.fn(),
    },
  },
}));

const mockGetV3SpotPricesQueryOptions = jest.mocked(
  apiClient.prices.getV3SpotPricesQueryOptions,
);
const mockSpotPricesFetch = jest.fn();

describe('useCurrentPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpotPricesFetch.mockResolvedValue({});
    mockGetV3SpotPricesQueryOptions.mockImplementation(
      (assetIds, queryOptions) => ({
        queryKey: ['prices', 'v3SpotPrices', assetIds, queryOptions],
        queryFn: mockSpotPricesFetch,
      }),
    );
  });

  const ethNativeAssetId = 'eip155:1/slip44:60';
  const usdcAssetId =
    'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const ethConversionRate = 1776.47;
  // Legacy fixture priced USDC in "USDC" (rate 1). Unified marketData is always
  // native-denominated; assetsPrice.price is the fiat price so currentPrice matches.
  const usdcFiatPrice = 0.9998967852645477;

  const mockBaseState = {
    metamask: {
      isUnlocked: true,
      completedOnboarding: true,
      selectedCurrency: 'usd',
      selectedNetworkClientId: 'selectedNetworkClientId',
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum',
          nativeCurrency: 'ETH',
          isEvm: true,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId',
            },
          ],
        },
        [SolScope.Mainnet]: {
          chainId: SolScope.Mainnet,
          name: 'Solana',
          nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
          isEvm: false,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId2',
            },
          ],
        },
      },
      useCurrencyRateCheck: true,
      internalAccounts: {
        accounts: {
          '81b1ead4-334c-4921-9adf-282fde539752': {
            id: '81b1ead4-334c-4921-9adf-282fde539752',
            address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
            type: 'eip155:eoa',
            scopes: [EthScope.Eoa],
          },
          '5132883f-598e-482c-a02b-84eeaa352f5b': {
            id: '5132883f-598e-482c-a02b-84eeaa352f5b',
            address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
            type: 'solana:data-account',
            scopes: [SolScope.Mainnet],
          },
        },
        selectedAccount: '', // To be set in each test
      },
    },
  };

  describe('when the chain is EVM', () => {
    const mockStateIsEvm = {
      metamask: {
        ...mockBaseState.metamask,
        assetsInfo: {
          [ethNativeAssetId]: {
            type: 'native',
            decimals: 18,
            symbol: 'ETH',
          },
          [usdcAssetId]: {
            type: 'erc20',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
        },
        assetsPrice: {
          [ethNativeAssetId]: {
            assetPriceType: 'fungible',
            price: ethConversionRate,
            usdPrice: ethConversionRate,
            lastUpdated: 1745579164.04 * 1000,
          },
          [usdcAssetId]: {
            assetPriceType: 'fungible',
            // Round-trip through native rate yields fiat currentPrice.
            price: usdcFiatPrice,
            usdPrice: usdcFiatPrice,
            lastUpdated: 1745579164.04 * 1000,
          },
        },
        internalAccounts: {
          ...mockBaseState.metamask.internalAccounts,
          selectedAccount: '',
        },
      },
    };

    it('returns the current price for a native asset', () => {
      const nativeAsset: Asset = {
        type: AssetType.native,
        isOriginalNativeSymbol: true,
        decimals: 18,
        chainId: '0x1',
        symbol: 'ETH',
        name: 'Ether',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(nativeAsset),
        mockStateIsEvm,
      );

      expect(result.current.currentPrice).toBe(1776.47);
    });

    it('returns the current price for a token asset', () => {
      const tokenAsset: Asset = {
        chainId: '0x1',
        type: AssetType.token,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAsset),
        mockStateIsEvm,
      );

      expect(result.current.currentPrice).toBe(0.9998967852645477);
    });

    it('fetches the spot price when market data is missing', async () => {
      const address = '0xe4246B1Ac0Ba6839d9efA41a8A30AE3007185f55';
      const assetId = `eip155:1/erc20:${address}`;
      const tokenAssetMissingMarket: Asset = {
        chainId: '0x1',
        type: AssetType.token,
        address,
        symbol: 'MISS',
        decimals: 18,
        name: 'Missing Token',
        image: '',
      };

      mockSpotPricesFetch.mockResolvedValue({ [assetId]: { price: 1.23 } });

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAssetMissingMarket),
        mockStateIsEvm,
      );

      await waitFor(() => {
        expect(result.current.currentPrice).toBe(1.23);
      });

      expect(mockGetV3SpotPricesQueryOptions).toHaveBeenCalledWith([assetId], {
        currency: 'usd',
      });
    });

    it('does not fetch the spot price when market data is available', () => {
      const tokenAsset: Asset = {
        chainId: '0x1',
        type: AssetType.token,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        image: '',
      };

      renderHookWithProvider(() => useCurrentPrice(tokenAsset), mockStateIsEvm);

      expect(mockSpotPricesFetch).not.toHaveBeenCalled();
    });

    it('returns undefined if currency rate is missing', () => {
      const tokenAsset: Asset = {
        chainId: '0x1',
        type: AssetType.token,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        image: '',
      };

      const mockStateMissingRate = {
        metamask: {
          ...mockStateIsEvm.metamask,
          assetsInfo: {
            [usdcAssetId]: mockStateIsEvm.metamask.assetsInfo[usdcAssetId],
          },
          assetsPrice: {
            [usdcAssetId]: mockStateIsEvm.metamask.assetsPrice[usdcAssetId],
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAsset),
        mockStateMissingRate,
      );

      expect(result.current.currentPrice).toBeUndefined();
    });
  });

  describe('when the chain is non-EVM', () => {
    const solNativeAssetId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
    const elonaiAssetId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:4UWRG4THDmdydQnr4hqECN32eNdTHKKs7KVEW1ATpump';

    const mockStateIsNonEvm = {
      metamask: {
        ...mockBaseState.metamask,
        assetsInfo: {
          [solNativeAssetId]: {
            type: 'native',
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          [elonaiAssetId]: {
            type: 'token',
            decimals: 6,
            symbol: 'ELONAI',
            name: 'ElonAI',
          },
        },
        assetsPrice: {
          [solNativeAssetId]: {
            assetPriceType: 'fungible',
            price: 154.09,
            usdPrice: 154.09,
            lastUpdated: 1745579168909,
            marketCap: 79688385165,
            totalVolume: 4459155642,
            circulatingSupply: 517436215.2641955,
            allTimeHigh: 293.31,
            allTimeLow: 0.500801,
            pricePercentChange1h: 0.20080884925986253,
            pricePercentChange1d: 4.9706348383147745,
            pricePercentChange7d: 14.314708210794603,
            pricePercentChange14d: 30.56881144800791,
            pricePercentChange30d: 6.844730805437679,
            pricePercentChange200d: 4.796845517353229,
            pricePercentChange1y: 5.499416857017334,
          },
          [elonaiAssetId]: {
            assetPriceType: 'fungible',
            price: 0.0000029141089909628,
            usdPrice: 0.0000029141089909628,
            lastUpdated: 1745579166794,
            marketCap: 2910.568726283457,
            totalVolume: 0.6286020475620975,
            circulatingSupply: 0,
            pricePercentChange1d: 4.033766775371256,
          },
        },
        internalAccounts: {
          ...mockBaseState.metamask.internalAccounts,
          selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
        },
      },
    };

    it('returns the current price for a native asset', () => {
      const nativeAsset: Asset = {
        type: AssetType.native,
        isOriginalNativeSymbol: true,
        decimals: 9,
        chainId: SolScope.Mainnet as any,
        symbol: 'SOL',
        name: 'Solana',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(nativeAsset),
        mockStateIsNonEvm,
      );

      expect(result.current.currentPrice).toBe(154.09);
    });

    it('returns the current price for a token asset', () => {
      const tokenAsset: Asset = {
        chainId: SolScope.Mainnet as any,
        type: AssetType.token,
        address:
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:4UWRG4THDmdydQnr4hqECN32eNdTHKKs7KVEW1ATpump',
        symbol: 'ELONAI',
        decimals: 6,
        name: 'ElonAI',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAsset),
        mockStateIsNonEvm,
      );

      expect(result.current.currentPrice).toBe(0.0000029141089909628);
    });

    it('fetches the spot price when the conversion rate is missing', async () => {
      const assetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:MissingTokenAddress';
      const tokenAssetMissingMarket: Asset = {
        chainId: SolScope.Mainnet as any,
        type: AssetType.token,
        address: assetId,
        symbol: 'MISS',
        decimals: 6,
        name: 'Missing Token',
        image: '',
      };

      mockSpotPricesFetch.mockResolvedValue({ [assetId]: { price: 0.42 } });

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAssetMissingMarket),
        mockStateIsNonEvm,
      );

      await waitFor(() => {
        expect(result.current.currentPrice).toBe(0.42);
      });

      expect(mockGetV3SpotPricesQueryOptions).toHaveBeenCalledWith([assetId], {
        currency: 'usd',
      });
    });
  });
});
