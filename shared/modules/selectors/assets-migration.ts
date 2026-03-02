import {
  parseCaipAssetType,
  type CaipAssetType,
  Hex,
  bigIntToHex,
  KnownCaipNamespace,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { AssetsControllerState } from '@metamask/assets-controller';
import {
  AccountTrackerControllerState,
  MultichainAssetsControllerState,
  MultichainBalancesControllerState,
  getNativeTokenAddress,
  Token,
  TokenBalancesControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { decimalToPrefixedHex } from '../conversion.utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateFeatureEnabled,
  type AssetsUnifyStateFeatureFlag,
} from '../../lib/assets-unify-state/remote-feature-flag';
import { createDeepEqualSelector } from './selector-creators';

// Old state controllers and fields status
//
// AccountTrackerController
// accountsByChainId: DONE
//
// TokensController
// allTokens: DONE
// allIgnoredTokens: DONE
// allDetectedTokens: TODO (This state should be removed)
//
// TokenBalancesController
// tokenBalances: DONE
//
// CurrencyRateController
// currencyRates: TODO
// currentCurrency: TODO
//
// TokenRatesController
// marketData: TODO
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
// conversionRates: TODO
// historicalPrices: TODO (This state should be removed)
//
// TokenListController
// tokensChainsCache: TODO (There are no plans to port this state)
//
// RatesController
// rates: TODO (This state should be removed)

// This utility type makes the selector forceably require just the state that was originally required
// For selectors with custom state input, this prevents their input type from requiring additional state that will not be needed after the migration
type ControllerStateSelector<
  InputState extends Record<string, unknown>,
  ResultField extends keyof InputState,
> = (state: {
  metamask: Pick<InputState, ResultField>;
}) => InputState[ResultField];

const getIsAssetsUnifyStateEnabled = createDeepEqualSelector(
  [
    (state: { metamask: RemoteFeatureFlagControllerState }) =>
      state.metamask?.remoteFeatureFlags ?? {},
  ],
  (remoteFeatureFlags) => {
    const featureFlag = remoteFeatureFlags[ASSETS_UNIFY_STATE_FLAG] as
      | AssetsUnifyStateFeatureFlag
      | undefined;

    return isAssetsUnifyStateFeatureEnabled(
      featureFlag,
      ASSETS_UNIFY_STATE_VERSION_1,
    );
  },
);

// ChainId (hex) -> AccountAddress (hex checksummed) -> Balance (hex)
export const getAccountTrackerControllerAccountsByChainId =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: {
        metamask: Pick<AccountTrackerControllerState, 'accountsByChainId'>;
      }) => state.metamask?.accountsByChainId ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'assetsBalance'> }) =>
        state.metamask?.assetsBalance ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'assetsInfo'> }) =>
        state.metamask?.assetsInfo ?? {},
      (state: {
        metamask: Pick<AccountsControllerState, 'internalAccounts'>;
      }) => state.metamask?.internalAccounts?.accounts ?? {},
    ],
    (
      isAssetsUnifyStateEnabled,
      accountsByChainId,
      assetsBalance,
      assetsInfo,
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
        if (!internalAccount || !isEvmAccountType(internalAccount.type)) {
          continue;
        }

        const checksummedAddress = toChecksumHexAddress(
          internalAccount.address,
        );

        for (const [assetId, balanceData] of Object.entries(accountBalances)) {
          const metadata = assetsInfo[assetId];
          if (metadata?.type !== 'native') {
            continue;
          }

          const { chain: parsedChain } = parseCaipAssetType(
            assetId as CaipAssetType,
          );

          // No need to check if the chain is EVM, we already filtered out non-EVM accounts
          const hexChainId = decimalToPrefixedHex(parsedChain.reference);
          const amount = balanceData?.amount ?? '0';

          result[hexChainId] ??= {};
          result[hexChainId][checksummedAddress] = {
            // TODO: Use raw value from state when available
            balance: parseBalanceWithDecimals(amount, metadata.decimals),
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
    (state: { metamask: Pick<TokensControllerState, 'allTokens'> }) =>
      state.metamask?.allTokens ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsInfo'> }) =>
      state.metamask?.assetsInfo ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsBalance'> }) =>
      state.metamask?.assetsBalance ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'customAssets'> }) =>
      state.metamask?.customAssets ?? {},
    (state: { metamask: Pick<AccountsControllerState, 'internalAccounts'> }) =>
      state.metamask?.internalAccounts?.accounts ?? {},
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
        return [
          accountId,
          [...new Set([...fromBalance, ...fromCustom])] as CaipAssetType[],
        ];
      }),
    );

    for (const [accountId, assetIds] of Object.entries(allAssets)) {
      const internalAccount = internalAccountsById[accountId];
      if (!internalAccount || !isEvmAccountType(internalAccount.type)) {
        continue;
      }

      for (const assetId of assetIds) {
        const metadata = assetsInfo[assetId];
        if (!metadata || metadata.type === 'native') {
          continue;
        }

        const assetType = parseCaipAssetType(assetId);

        // No need to check if the chain is EVM, we already filtered out non-EVM accounts
        const hexChainId = decimalToPrefixedHex(assetType.chain.reference);
        const assetAddress = toChecksumHexAddress(assetType.assetReference);

        const token: Token = {
          address: assetAddress,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          name: metadata.name,
          image: metadata.image,
        };

        result[hexChainId] ??= {};
        result[hexChainId][internalAccount.address] ??= [];
        result[hexChainId][internalAccount.address].push(token);
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<TokensControllerState, 'allTokens'>;

// ChainId (hex) -> AccountAddress (hex lowercase) -> Array of TokenAddress (hex lowercase)
export const getTokensControllerAllIgnoredTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: Pick<TokensControllerState, 'allIgnoredTokens'> }) =>
      state.metamask?.allIgnoredTokens ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetPreferences'> }) =>
      state.metamask?.assetPreferences ?? {},
    (state: { metamask: Pick<AccountsControllerState, 'internalAccounts'> }) =>
      state.metamask?.internalAccounts?.accounts ?? {},
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

      // The asset is hidden for all EVM accounts
      for (const internalAccount of Object.values(internalAccountsById)) {
        if (!isEvmAccountType(internalAccount.type)) {
          continue;
        }

        result[hexChainId] ??= {};
        result[hexChainId][internalAccount.address] ??= [];
        result[hexChainId][internalAccount.address].push(
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
    (state: {
      metamask: Pick<TokenBalancesControllerState, 'tokenBalances'>;
    }) => state.metamask?.tokenBalances ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsInfo'> }) =>
      state.metamask?.assetsInfo ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsBalance'> }) =>
      state.metamask?.assetsBalance ?? {},
    (state: { metamask: Pick<AccountsControllerState, 'internalAccounts'> }) =>
      state.metamask?.internalAccounts?.accounts ?? {},
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
      const internalAccount = internalAccountsById[accountId];
      if (!internalAccount || !isEvmAccountType(internalAccount.type)) {
        continue;
      }

      const accountAddress = internalAccount.address as Hex;
      result[accountAddress] = {};

      for (const [assetId, assetBalance] of Object.entries(chainIdBalances)) {
        const metadata = assetsInfo[assetId];
        if (!metadata) {
          continue;
        }

        const assetType = parseCaipAssetType(assetId as CaipAssetType);

        // No need to check if the chain is EVM, we already filtered out non-EVM accounts
        const hexChainId = decimalToPrefixedHex(assetType.chain.reference);
        const assetAddress = toChecksumHexAddress(
          metadata.type === 'native'
            ? getNativeTokenAddress(hexChainId)
            : assetType.assetReference,
        ) as Hex;

        result[accountAddress][hexChainId] ??= {};
        result[accountAddress][hexChainId][assetAddress] =
          // TODO: Use raw value from state when available
          parseBalanceWithDecimals(assetBalance.amount, metadata.decimals);
      }
    }

    return result;
  },
) as unknown as ControllerStateSelector<
  TokenBalancesControllerState,
  'tokenBalances'
>;

// AccountId -> Array of AssetIds
export const getMultiChainAssetsControllerAccountsAssets =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: {
        metamask: Pick<MultichainAssetsControllerState, 'accountsAssets'>;
      }) => state.metamask?.accountsAssets ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'assetsBalance'> }) =>
        state.metamask?.assetsBalance ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'customAssets'> }) =>
        state.metamask?.customAssets ?? {},
      (state: {
        metamask: Pick<AccountsControllerState, 'internalAccounts'>;
      }) => state.metamask?.internalAccounts?.accounts ?? {},
    ],
    (
      isAssetsUnifyStateEnabled,
      accountsAssets,
      assetsBalance,
      customAssets,
      internalAccountsById,
    ) => {
      if (!isAssetsUnifyStateEnabled) {
        return accountsAssets;
      }

      const result: MultichainAssetsControllerState['accountsAssets'] = {};

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
          return [
            accountId,
            [...new Set([...fromBalance, ...fromCustom])] as CaipAssetType[],
          ];
        }),
      );

      for (const [accountId, assetIds] of Object.entries(allAssets)) {
        const internalAccount = internalAccountsById[accountId];
        if (!internalAccount || isEvmAccountType(internalAccount.type)) {
          continue;
        }

        result[accountId] = [];

        for (const assetId of assetIds) {
          const assetType = parseCaipAssetType(assetId);
          if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
            continue;
          }

          result[accountId].push(assetId);
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsControllerState,
    'accountsAssets'
  >;

// TODO There are issues with the new image url not matching the one in assetsMetadata iconUrl
// AssetId -> AssetMetadata
export const getMultiChainAssetsControllerAssetsMetadata =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: {
        metamask: Pick<MultichainAssetsControllerState, 'assetsMetadata'>;
      }) => state.metamask?.assetsMetadata ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'assetsInfo'> }) =>
        state.metamask?.assetsInfo ?? {},
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
      (state: {
        metamask: Pick<MultichainAssetsControllerState, 'allIgnoredAssets'>;
      }) => state.metamask?.allIgnoredAssets ?? {},
      (state: { metamask: Pick<AssetsControllerState, 'assetPreferences'> }) =>
        state.metamask?.assetPreferences ?? {},
      (state: {
        metamask: Pick<AccountsControllerState, 'internalAccounts'>;
      }) => state.metamask?.internalAccounts?.accounts ?? {},
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

      for (const accountId of Object.keys(internalAccountsById)) {
        const internalAccount = internalAccountsById[accountId];
        if (!internalAccount || isEvmAccountType(internalAccount.type)) {
          continue;
        }

        result[accountId] = [];

        for (const [assetId, { hidden }] of Object.entries(assetPreferences)) {
          if (!hidden) {
            continue;
          }

          const assetType = parseCaipAssetType(assetId as CaipAssetType);
          if (assetType.chain.namespace === KnownCaipNamespace.Eip155) {
            continue;
          }

          result[accountId].push(assetId as CaipAssetType);
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    MultichainAssetsControllerState,
    'allIgnoredAssets'
  >;

// AccountId -> AssetId -> Balance (amount + unit)
export const getMultiChainBalancesControllerBalances = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: {
      metamask: Pick<MultichainBalancesControllerState, 'balances'>;
    }) => state.metamask?.balances ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsBalance'> }) =>
      state.metamask?.assetsBalance ?? {},
    (state: { metamask: Pick<AssetsControllerState, 'assetsInfo'> }) =>
      state.metamask?.assetsInfo ?? {},
    (state: { metamask: Pick<AccountsControllerState, 'internalAccounts'> }) =>
      state.metamask?.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    balances,
    assetsBalance,
    assetsInfo,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return balances;
    }

    const result: MultichainBalancesControllerState['balances'] = {};

    for (const [accountId, chainIdBalances] of Object.entries(assetsBalance)) {
      const internalAccount = internalAccountsById[accountId];
      if (!internalAccount || isEvmAccountType(internalAccount.type)) {
        continue;
      }

      result[accountId] = {};

      for (const [assetId, balance] of Object.entries(chainIdBalances)) {
        const assetType = parseCaipAssetType(assetId as CaipAssetType);
        const metadata = assetsInfo[assetId];

        if (
          !metadata ||
          assetType.chain.namespace === KnownCaipNamespace.Eip155
        ) {
          continue;
        }

        result[accountId][assetId] = {
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

function parseBalanceWithDecimals(
  balanceString: string,
  decimals: number,
): Hex {
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
