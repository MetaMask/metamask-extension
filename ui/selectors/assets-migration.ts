import {
  parseCaipAssetType,
  KnownCaipNamespace,
  type CaipAssetType,
  Hex,
  bigIntToHex,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  AssetsControllerState,
  FungibleAssetPrice,
} from '@metamask/assets-controller';
import {
  Token,
  TokenBalancesControllerState,
  TokensControllerState,
  AccountTrackerControllerState,
  MultichainAssetsControllerState,
  MultichainBalancesControllerState,
  CurrencyRateState,
  TokenRatesControllerState,
  MarketDataDetails,
  MultichainAssetsRatesControllerState,
} from '@metamask/assets-controllers';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { decimalToPrefixedHex } from '../../shared/modules/conversion.utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/selector-creators';
import { getIsAssetsUnifyStateEnabled } from './assets-unify-state/feature-flags';

// TODO Old state
// AccountTrackerController
// accountsByChainId: DONE
//
// TokensController
// allTokens: DONE
// allIgnoredTokens: DONE
// allDetectedTokens: TODO (is this even used? Can it be removed?)
//
// TokenBalancesController
// tokenBalances: DONE
//
// CurrencyRateController
// currencyRates: DONE
// currentCurrency: DONE
//
// TokenRatesController
// marketData: DONE
//
// MultichainAssetsController
// accountsAssets: DONE
// assetsMetadata: DONE
// allIgnoredAssets: DONE
//
// MultichainBalancesController
// balances: DONE
//
// MultichainAssetsRatesController
// conversionRates: DONE
// historicalPrices: TODO (we should probably stop using this as state and fetch it whenever is needed)
//
// TokenListController
// tokensChainsCache: TODO (there are no plans to port this state)
//
// RatesController
// rates: TODO (is this even used? Can it be removed?)

type ControllerStateSelector<
  InputState extends Record<string, unknown>,
  ResultField extends keyof InputState,
> = (state: { metamask: InputState }) => InputState[ResultField];

// ChainId (hex) -> AccountAddress (hex checksummed) -> Balance (hex)
export const getAccountTrackerControllerAccountsByChainId =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: AccountTrackerControllerState }) =>
        state.metamask.accountsByChainId ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetsInfo ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetsBalance ?? {},
      (state: { metamask: AccountsControllerState }) =>
        state.metamask.internalAccounts?.accounts ?? {},
    ],
    (
      isAssetsUnifyStateEnabled,
      accountsByChainId,
      assetsInfo,
      assetsBalance,
      internalAccountsById,
    ) => {
      if (!isAssetsUnifyStateEnabled) {
        return accountsByChainId;
      }

      const result: AccountTrackerControllerState['accountsByChainId'] = {};

      for (const [accountId, accountBalances] of Object.entries(
        assetsBalance,
      )) {
        const internalAccount = internalAccountsById[accountId];
        const address = internalAccount?.address;
        if (!address) {
          continue;
        }

        const checksummedAddress = toChecksumHexAddress(address);

        for (const [assetId, balanceData] of Object.entries(accountBalances)) {
          const metadata = assetsInfo[assetId];
          if (!metadata || metadata.type !== 'native') {
            continue;
          }

          const { chain: parsedChain } = parseCaipAssetType(
            assetId as CaipAssetType,
          );
          if (parsedChain.namespace !== KnownCaipNamespace.Eip155) {
            continue;
          }

          const hexChainId = decimalToPrefixedHex(parsedChain.reference);
          const amount = balanceData?.amount ?? '0';

          (result[hexChainId] ??= {})[checksummedAddress] = {
            // TODO: Use raw value from state when available
            balance:
              parseBalanceWithDecimals(amount, metadata.decimals) ?? '0x0',
          };
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    AccountTrackerControllerState,
    'accountsByChainId'
  >;

// ChainId (hex) -> AccountAddress (hex lowercase) -> Array of Tokens
export const getTokensControllerAllTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokensControllerState }) =>
      state.metamask.allTokens ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsInfo ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsBalance ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.customAssets ?? {},
    (state: { metamask: AccountsControllerState }) =>
      state.metamask.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    allTokens,
    assetsInfo,
    assetsBalance,
    customAssets,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return allTokens;
    }

    const result: TokensControllerState['allTokens'] = {};

    // Merge assetsBalance and customAssets: accountId -> assetId[]
    const allAssets = Object.fromEntries(
      [
        ...new Set([
          ...Object.keys(assetsBalance),
          ...Object.keys(customAssets),
        ]),
      ].map((accountId) => {
        const fromBalance = Object.keys(assetsBalance[accountId] ?? {});
        const fromCustom = customAssets[accountId] ?? [];
        return [accountId, [...new Set([...fromBalance, ...fromCustom])]];
      }),
    );

    for (const [accountId, assetIds] of Object.entries(allAssets)) {
      const internalAccount = internalAccountsById[accountId];
      if (!internalAccount || !isEvmAccountType(internalAccount.type)) {
        continue;
      }

      for (const assetId of assetIds) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        const metadata = assetsInfo[assetId];

        if (
          !metadata ||
          metadata.type === 'native' ||
          assetType.chain.namespace !== KnownCaipNamespace.Eip155
        ) {
          continue;
        }

        const hexChainId = decimalToPrefixedHex(assetType.chain.reference);
        const address = toChecksumHexAddress(assetType.assetReference);

        const token: Token = {
          address,
          symbol: metadata.symbol ?? '',
          decimals: metadata.decimals ?? 18,
          name: metadata.name,
          image: metadata.image,
        };

        ((result[hexChainId] ??= {})[internalAccount.address] ??= []).push(
          token,
        );
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<TokensControllerState, 'allTokens'>;

// ChainId (hex) -> AccountAddress (hex lowercase) -> Array of TokenAddress (hex lowercase)
export const getTokensControllerAllIgnoredTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokensControllerState }) =>
      state.metamask.allIgnoredTokens ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetPreferences ?? {},
    (state: { metamask: AccountsControllerState }) =>
      state.metamask.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    allIgnoredTokens,
    assetPreferences,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return allIgnoredTokens;
    }

    const result: TokensControllerState['allIgnoredTokens'] = {};

    for (const [assetId, { hidden }] of Object.entries(assetPreferences)) {
      if (!hidden) {
        continue;
      }

      const assetType = parseCaipAssetType(assetId as CaipAssetType);

      if (assetType.chain.namespace !== KnownCaipNamespace.Eip155) {
        continue;
      }

      const hexChainId = decimalToPrefixedHex(assetType.chain.reference);

      for (const account of Object.values(internalAccountsById)) {
        if (!isEvmAccountType(account.type)) {
          continue;
        }

        ((result[hexChainId] ??= {})[account.address] ??= []).push(
          assetType.assetReference,
        );
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<
  TokensControllerState,
  'allIgnoredTokens'
>;

// AcountAddress (hex lowercase) -> ChainId (hex) -> TokenAddress (hex checksummed) -> Balance (hex)
export const getTokenBalancesControllerTokenBalances = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokenBalancesControllerState }) =>
      state.metamask.tokenBalances ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsInfo ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsBalance ?? {},
    (state: { metamask: AccountsControllerState }) =>
      state.metamask.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    tokenBalances,
    assetsInfo,
    assetsBalance,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return tokenBalances;
    }

    const result: TokenBalancesControllerState['tokenBalances'] = {};

    for (const [accountId, chainIdBalances] of Object.entries(assetsBalance)) {
      const accountAddress = internalAccountsById[accountId]?.address as Hex;
      if (!accountAddress) {
        continue;
      }

      for (const [assetId, assetBalance] of Object.entries(chainIdBalances)) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        const metadata = assetsInfo[assetId];

        if (
          !metadata ||
          assetType.chain.namespace !== KnownCaipNamespace.Eip155
        ) {
          continue;
        }

        const hexChainId = decimalToPrefixedHex(assetType.chain.reference);
        const assetAddress = (
          metadata.type === 'native'
            ? getNativeAssetForChainId(hexChainId).address
            : toChecksumHexAddress(assetType.assetReference)
        ) as Hex;

        // TODO: Use raw value from state when available
        ((result[accountAddress] ??= {})[hexChainId] ??= {})[assetAddress] =
          parseBalanceWithDecimals(
            assetBalance.amount,
            metadata.decimals,
          ) as Hex;
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<
  TokenBalancesControllerState,
  'tokenBalances'
>;

// AccountId (string) -> Array of AssetIds (string)
export const getMultiChainAssetsControllerAccountsAssets =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.accountsAssets ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetsBalance ?? {},
    ],
    (isAssetsUnifyStateEnabled, accountsAssets, assetsBalance) => {
      if (!isAssetsUnifyStateEnabled) {
        return accountsAssets;
      }

      const result: MultichainAssetsControllerState['accountsAssets'] = {};

      for (const [accountId, accountBalances] of Object.entries(
        assetsBalance,
      )) {
        for (const assetId of Object.keys(accountBalances)) {
          (result[accountId] ??= []).push(assetId as CaipAssetType);
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsControllerState,
    'accountsAssets'
  >;

// TODO There are issues with the new image url not matching the one in assetsMetadata iconUrl
// AssetId (string) -> AssetMetadata
export const getMultiChainAssetsControllerAssetsMetadata =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.assetsMetadata ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetsInfo ?? {},
    ],
    (isAssetsUnifyStateEnabled, assetsMetadata, assetsInfo) => {
      if (!isAssetsUnifyStateEnabled) {
        return assetsMetadata;
      }

      const result: MultichainAssetsControllerState['assetsMetadata'] = {};

      for (const [assetId, metadata] of Object.entries(assetsInfo)) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
          continue;
        }

        result[assetId as CaipAssetType] = {
          fungible: true,
          iconUrl: metadata.image ?? '',
          units: [
            {
              decimals: metadata.decimals,
              symbol: metadata.symbol,
              name: metadata.name,
            },
          ],
          symbol: metadata.symbol,
          name: metadata.name,
        };
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsControllerState,
    'assetsMetadata'
  >;

// AccountId -> Array of AssetIds
export const getMultiChainAssetsControllerAllIgnoredAssets =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.allIgnoredAssets ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetPreferences ?? {},
      (state: { metamask: AccountsControllerState }) =>
        state.metamask.internalAccounts?.accounts ?? {},
    ],
    (
      isAssetsUnifyStateEnabled,
      allIgnoredAssets,
      assetPreferences,
      internalAccountsById,
    ) => {
      if (!isAssetsUnifyStateEnabled) {
        return allIgnoredAssets;
      }

      const result: MultichainAssetsControllerState['allIgnoredAssets'] = {};

      for (const [assetId, { hidden }] of Object.entries(assetPreferences)) {
        if (!hidden) {
          continue;
        }

        const assetType = parseCaipAssetType(assetId as CaipAssetType);

        if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
          continue;
        }

        for (const accountId of Object.keys(internalAccountsById)) {
          (result[accountId] ??= []).push(assetId as CaipAssetType);
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsControllerState,
    'allIgnoredAssets'
  >;

export const getMultiChainBalancesControllerBalances = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: MultichainBalancesControllerState }) =>
      state.metamask.balances ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsBalance ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsInfo ?? {},
  ],
  (isAssetsUnifyStateEnabled, balances, assetsBalance, assetsInfo) => {
    if (!isAssetsUnifyStateEnabled) {
      return balances;
    }

    const result: MultichainBalancesControllerState['balances'] = {};

    for (const [accountId, chainIdBalances] of Object.entries(assetsBalance)) {
      for (const [assetId, balance] of Object.entries(chainIdBalances)) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        const metadata = assetsInfo[assetId];

        if (
          !metadata ||
          assetType.chain.namespace === KnownCaipNamespace.Eip155
        ) {
          continue;
        }

        (result[accountId] ??= {})[assetId] = {
          amount: balance.amount,
          unit: metadata.symbol,
        };
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<
  MultichainBalancesControllerState,
  'balances'
>;

export const getCurrencyRateControllerCurrentCurrency = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: CurrencyRateState }) =>
      state.metamask.currentCurrency ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.selectedCurrency,
  ],
  (isAssetsUnifyStateEnabled, currentCurrency, selectedCurrency) => {
    if (!isAssetsUnifyStateEnabled) {
      return currentCurrency;
    }

    return selectedCurrency;
  },
) as unknown as ControllerStateSelector<CurrencyRateState, 'currentCurrency'>;

// Native Symbol -> Rates (conversionRate, usdConversionRate, conversionDate)
export const getCurrencyRateControllerCurrencyRates = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: CurrencyRateState }) =>
      state.metamask.currencyRates ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsInfo ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsPrice ?? {},
  ],
  (isAssetsUnifyStateEnabled, currencyRates, assetsInfo, assetsPrice) => {
    if (!isAssetsUnifyStateEnabled) {
      return currencyRates;
    }

    const result: CurrencyRateState['currencyRates'] = {};

    const allNativeAssets = Object.entries(assetsInfo)
      .filter(([assetId, metadata]) => {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);

        return (
          metadata.type === 'native' &&
          assetType.chain.namespace === KnownCaipNamespace.Eip155 &&
          // This is a hack to handle the fact that ETH is the native asset for many chains, but the one from mainnet is used as reference here
          (!['ETH'].includes(metadata.symbol) ||
            (metadata.symbol === 'ETH' && assetType.chain.reference === '1'))
        );
      })
      .map(([assetId, metadata]) => {
        return {
          assetId,
          symbol: metadata.symbol,
        };
      });

    for (const { assetId, symbol } of allNativeAssets) {
      const price = assetsPrice[assetId];
      if (!price) {
        continue;
      }

      result[symbol] = {
        conversionDate: price.lastUpdated / 1000,
        conversionRate: price.price,
        usdConversionRate: null,
      };
    }

    return result;
  },
) as unknown as ControllerStateSelector<CurrencyRateState, 'currencyRates'>;

// ChainId (hex) -> TokenAddress (hex checksummed) -> MarketData
export const getTokenRatesControllerMarketData = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokenRatesControllerState }) =>
      state.metamask.marketData ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsPrice ?? {},
    (state: { metamask: AssetsControllerState }) =>
      state.metamask.assetsInfo ?? {},
    getCurrencyRateControllerCurrencyRates,
  ],
  (
    isAssetsUnifyStateEnabled,
    marketData,
    assetsPrice,
    assetsInfo,
    currencyRates,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return marketData;
    }

    const result: TokenRatesControllerState['marketData'] = {};

    for (const [assetId, price] of Object.entries(assetsPrice) as [
      CaipAssetType,
      FungibleAssetPrice,
    ][]) {
      const assetType = parseCaipAssetType(assetId as CaipAssetType);
      const metadata = assetsInfo[assetId];
      if (
        !metadata ||
        assetType.chain.namespace !== KnownCaipNamespace.Eip155
      ) {
        continue;
      }

      const hexChainId = decimalToPrefixedHex(assetType.chain.reference);
      const nativeAsset = getNativeAssetForChainId(hexChainId);

      const assetAddress = (
        metadata.type === 'native'
          ? nativeAsset.address
          : toChecksumHexAddress(assetType.assetReference)
      ) as Hex;

      const nativeCurrencyRate =
        currencyRates[nativeAsset.symbol]?.conversionRate;
      if (!nativeCurrencyRate) {
        continue;
      }

      const convertToNativeCurrency = (amount: number | undefined) => {
        return amount === undefined ? undefined : amount / nativeCurrencyRate;
      };

      (result[hexChainId] ??= {})[assetAddress] = {
        id: price.id,
        price: convertToNativeCurrency(price.price),
        marketCap: convertToNativeCurrency(price.marketCap),
        allTimeHigh: convertToNativeCurrency(price.allTimeHigh),
        allTimeLow: convertToNativeCurrency(price.allTimeLow),
        totalVolume: convertToNativeCurrency(price.totalVolume),
        high1d: convertToNativeCurrency(price.high1d),
        low1d: convertToNativeCurrency(price.low1d),
        circulatingSupply: price.circulatingSupply,
        dilutedMarketCap: convertToNativeCurrency(price.dilutedMarketCap),
        marketCapPercentChange1d: price.marketCapPercentChange1d,
        priceChange1d: price.priceChange1d,
        pricePercentChange1h: price.pricePercentChange1h,
        pricePercentChange1d: price.pricePercentChange1d,
        pricePercentChange7d: price.pricePercentChange7d,
        pricePercentChange14d: price.pricePercentChange14d,
        pricePercentChange30d: price.pricePercentChange30d,
        pricePercentChange200d: price.pricePercentChange200d,
        pricePercentChange1y: price.pricePercentChange1y,
        chainId: hexChainId,
        tokenAddress: assetAddress,
        assetId,
        currency: nativeAsset.symbol,
      } as MarketDataDetails;
    }

    return result;
  },
) as unknown as ControllerStateSelector<
  TokenRatesControllerState,
  'marketData'
>;

export const getMultichainAssetsRatesControllerConversionRates =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsRatesControllerState }) =>
        state.metamask.conversionRates ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask.assetsPrice ?? {},
    ],
    (isAssetsUnifyStateEnabled, conversionRates, assetsPrice) => {
      if (!isAssetsUnifyStateEnabled) {
        return conversionRates;
      }

      const result: MultichainAssetsRatesControllerState['conversionRates'] =
        {};

      for (const [assetId, price] of Object.entries(assetsPrice) as [
        CaipAssetType,
        FungibleAssetPrice,
      ][]) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
          continue;
        }

        result[assetId] = {
          rate: `${price.price}`,
          conversionTime: price.lastUpdated,
          expirationTime: undefined,
          marketData: {
            fungible: true,
            allTimeHigh: `${price.allTimeHigh}`,
            allTimeLow: `${price.allTimeLow}`,
            circulatingSupply: `${price.circulatingSupply}`,
            marketCap: `${price.marketCap}`,
            totalVolume: `${price.totalVolume}`,
            pricePercentChange: {
              PT1H: price.pricePercentChange1h as number,
              P1D: price.pricePercentChange1d as number,
              P7D: price.pricePercentChange7d as number,
              P14D: price.pricePercentChange14d as number,
              P30D: price.pricePercentChange30d as number,
              P200D: price.pricePercentChange200d as number,
              P1Y: price.pricePercentChange1y as number,
            },
          },
        };
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsRatesControllerState,
    'conversionRates'
  >;

function parseBalanceWithDecimals(
  balanceString: string,
  decimals: number,
): Hex | undefined {
  // Allows: "123", "123.456", "0.123", but not: "-123", "123.", "abc", "12.34.56"
  if (!/^\d+(\.\d+)?$/u.test(balanceString)) {
    return undefined;
  }

  const [integerPart, fractionalPart = ''] = balanceString.split('.');

  if (decimals === 0) {
    return bigIntToHex(BigInt(integerPart));
  }

  if (fractionalPart.length >= decimals) {
    return bigIntToHex(
      BigInt(`${integerPart}${fractionalPart.slice(0, decimals)}`),
    );
  }

  return bigIntToHex(
    BigInt(
      `${integerPart}${fractionalPart}${'0'.repeat(
        decimals - fractionalPart.length,
      )}`,
    ),
  );
}
