/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetType } from '@metamask/bridge-controller';
import { EthScope, SolScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { Asset } from '../types/asset';
import { useCurrentPrice } from './useCurrentPrice';

describe('useCurrentPrice', () => {
  const mockBaseState = {
    metamask: {
      isUnlocked: true,
      completedOnboarding: true,
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
        currencyRates: {
          ETH: {
            conversionDate: 1745579164.04,
            conversionRate: 1776.47,
            usdConversionRate: 1776.47,
          },
          USDC: {
            conversionDate: 1745579164.04,
            conversionRate: 1,
            usdConversionRate: 1,
          },
        },
        marketData: {
          '0x1': {
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
              currency: 'USDC',
              tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              price: 0.9998967852645477,
            },
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

    it('returns undefined if market data is missing', () => {
      const tokenAssetMissingMarket: Asset = {
        chainId: '0x1',
        type: AssetType.token,
        address: '0xMissingTokenAddress', // An address not in marketData
        symbol: 'MISS',
        decimals: 18,
        name: 'Missing Token',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAssetMissingMarket),
        mockStateIsEvm,
      );

      expect(result.current.currentPrice).toBeUndefined();
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
          currencyRates: {},
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
    const mockStateIsNonEvm = {
      metamask: {
        ...mockBaseState.metamask,
        conversionRates: {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
            rate: '154.09',
            conversionTime: 1745579168909,
            expirationTime: 1745582768909,
            marketData: {
              marketCap: '79688385165',
              totalVolume: '4459155642',
              circulatingSupply: '517436215.2641955',
              allTimeHigh: '293.31',
              allTimeLow: '0.500801',
              pricePercentChange: {
                PT1H: 0.20080884925986253,
                P1D: 4.9706348383147745,
                P7D: 14.314708210794603,
                P14D: 30.56881144800791,
                P30D: 6.844730805437679,
                P200D: 4.796845517353229,
                P1Y: 5.499416857017334,
              },
            },
            currency: 'swift:0/iso4217:USD',
          },
          // ELONAI
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:4UWRG4THDmdydQnr4hqECN32eNdTHKKs7KVEW1ATpump':
            {
              rate: '0.0000029141089909628',
              conversionTime: 1745579166794,
              expirationTime: 1745582766794,
              marketData: {
                marketCap: '2910.568726283457',
                totalVolume: '0.6286020475620975',
                circulatingSupply: '0',
                allTimeHigh: '',
                allTimeLow: '',
                pricePercentChange: {
                  P1D: 4.033766775371256,
                },
              },
              currency: 'swift:0/iso4217:USD',
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

    it('returns undefined if market data is missing', () => {
      const tokenAssetMissingMarket: Asset = {
        chainId: SolScope.Mainnet as any,
        type: AssetType.token,
        address: 'solana:MissingTokenAddress/slip44:501',
        symbol: 'MISS',
        decimals: 6,
        name: 'Missing Token',
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useCurrentPrice(tokenAssetMissingMarket),
        mockStateIsNonEvm,
      );

      expect(result.current.currentPrice).toBeUndefined();
    });
  });
});
