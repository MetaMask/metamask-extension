import {
  parseCaipAssetType,
  KnownCaipNamespace,
  type CaipAssetType,
  Hex,
  bigIntToHex,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import { AssetsControllerState } from '@metamask/assets-controller';
import {
  Token,
  TokenBalancesControllerState,
  TokensControllerState,
  AccountTrackerControllerState,
  MultichainAssetsControllerState,
  MultichainBalancesControllerState,
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
// allIgnoredTokens: DONE *Alays empty because not yet plugged in client*
// allDetectedTokens: TODO (is this even used? Can it be removed?)
//
// TokenBalancesController
// tokenBalances: DONE
//
// TokenRatesController
// marketData: TODO (requires, for each evm asset, the price in the native currency asset for that chain)
//
// CurrencyRateController
// currencyRates: TODO (requires, for each different native ticker, the conversion rate to the current currency and to dollars)
// currentCurrency: TODO (this should come from preferences)
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
// conversionRates: TODO (requires, for each non-evm asset, the conversion rate to the current currency)
// historicalPrices: TODO (we should probably stop using this as state and fetch it whenever is needed)
//
// TokenListController
// tokensChainsCache: TODO (there are no plans to port this state)
//
// RatesController
// rates: TODO (is this even used? Can it be removed?)

type MetaMaskAssetsControllerState = {
  metamask: AssetsControllerState;
};

// ChainId (hex) -> AccountAddress (hex checksummed) -> Balance (hex)
export const getAccountTrackerControllerAccountsByChainId =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: AccountTrackerControllerState }) =>
        state.metamask.accountsByChainId ?? {},
      (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
      (state: MetaMaskAssetsControllerState) =>
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
  );

// ChainId (hex) -> AccountAddress (hex lowercase) -> Array of Tokens
export const getTokensControllerAllTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokensControllerState }) =>
      state.metamask.allTokens ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
    (state: MetaMaskAssetsControllerState) =>
      state.metamask.assetsBalance ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.customAssets ?? {},
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
);

// ChainId (hex) -> AccountAddress (hex lowercase) -> Array of TokenAddress (hex lowercase)
export const getTokensControllerAllIgnoredTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokensControllerState }) =>
      state.metamask.allIgnoredTokens ?? {},
    (state: MetaMaskAssetsControllerState) =>
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

      for (const accountId of Object.keys(internalAccountsById)) {
        ((result[hexChainId] ??= {})[accountId] ??= []).push(
          assetType.assetReference,
        );
      }
    }

    return result;
  },
);

// AcountAddress (hex lowercase) -> ChainId (hex) -> TokenAddress (hex checksummed) -> Balance (hex)
export const getTokenBalancesControllerTokenBalances = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokenBalancesControllerState }) =>
      state.metamask.tokenBalances ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
    (state: MetaMaskAssetsControllerState) =>
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
);

// AccountId (string) -> Array of AssetIds (string)
export const getMultiChainAssetsControllerAccountsAssets =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.accountsAssets ?? {},
      (state: MetaMaskAssetsControllerState) =>
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
  );

// TODO There are issues with the new image url not matching the one in assetsMetadata iconUrl
// AssetId (string) -> AssetMetadata
export const getMultiChainAssetsControllerAssetsMetadata =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.assetsMetadata ?? {},
      (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
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
  );

// AccountId -> Array of AssetIds
export const getMultiChainAssetsControllerAllIgnoredAssets =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: MultichainAssetsControllerState }) =>
        state.metamask.allIgnoredAssets ?? {},
      (state: MetaMaskAssetsControllerState) =>
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
  );

export const getMultiChainBalancesControllerBalances = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: MultichainBalancesControllerState }) =>
      state.metamask.balances ?? {},
    (state: MetaMaskAssetsControllerState) =>
      state.metamask.assetsBalance ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
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
);

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
