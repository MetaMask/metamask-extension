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
import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import {
  Token,
  TokenBalancesControllerState,
  TokensControllerState,
  AccountTrackerControllerState,
} from '@metamask/assets-controllers';
import { AccountsControllerState } from '@metamask/accounts-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { decimalToPrefixedHex } from '../../shared/modules/conversion.utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/selector-creators';
import { getIsAssetsUnifyStateEnabled } from './assets-unify-state/feature-flags';

// TODO Old state
// AccountTrackerController
// accountsByChainId: DONE
//
// TokensController
// allTokens: DONE
// allIgnoredTokens: DONE *Not yet plugged in actions*
// allDetectedTokens: TODO
//
// TokenBalancesController
// tokenBalances: TODO
//
// TokenRatesController
// marketData: TODO
//
// CurrencyRateController
// currencyRates: TODO
// currentCurrency: TODO
//
// MultichainAssetsController
// accountsAssets: TODO
// assetsMetadata: TODO
// allIgnoredAssets: TODO
//
// MultichainBalancesController
// balances: TODO
//
// MultichainAssetsRatesController
// conversionRates: TODO
// historicalPrices: TODO
//
// TokenListController
// tokensChainsCache: TODO
//
// RatesController
// rates: TODO

type MetaMaskAssetsControllerState = {
  metamask: {
    assetsInfo: AssetsControllerState['assetsInfo'];
    assetsBalance: AssetsControllerState['assetsBalance'];
    assetsPrice: AssetsControllerState['assetsPrice'];
    assetPreferences: AssetsControllerState['assetPreferences'];
  };
};

/**
 * Returns the EVM account in the currently selected account group (from accountTree).
 * Uses accountTree.selectedAccountGroup to find the group, then picks the first EVM account in that group.
 *
 * @param state
 * @param state.metamask
 */
// const selectedEvmAccount = createDeepEqualSelector(
//   [
//     (state: { metamask: AccountTreeControllerState }) =>
//       state.metamask.accountTree ?? {},
//     (state: { metamask: AccountsControllerState }) =>
//       state.metamask.internalAccounts?.accounts ?? {},
//   ],
//   (accountTree, internalAccountsById): InternalAccount | undefined => {
//     if (!accountTree.selectedAccountGroup || !accountTree.wallets) {
//       return undefined;
//     }

//     for (const treeWallet of Object.values(accountTree.wallets)) {
//       const group = treeWallet.groups?.[accountTree.selectedAccountGroup];
//       if (!group?.accounts?.length) {
//         continue;
//       }

//       const evmAccountId = group.accounts.find((accountId: string) => {
//         const account = internalAccountsById[accountId];
//         return account && isEvmAccountType(account.type);
//       });

//       if (evmAccountId) {
//         return internalAccountsById[evmAccountId];
//       }
//     }

//     return undefined;
//   },
// );

// TODO: Missing entries with zero balance
/**
 * Builds accountsByChainId from Assets Controller state (assetsInfo, assetsBalance).
 * Returns EVM native asset balances per chain per account (same shape as AccountTrackerController's accountsByChainId).
 * Staked balances are ignored for now.
 *
 * @param state
 * @param state.metamask
 */
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

// TODO: Missing entries with zero balance
/**
 * Builds allTokens (TokensController shape) from Assets Controller state for the
 * currently selected EVM account in the account group only.
 * Returns chainId -> address -> Token[] (ERC20 tokens only, EVM chains only).
 *
 * @param state
 * @param state.metamask
 */
export const getTokensControllerAllTokens = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: { metamask: TokensControllerState }) =>
      state.metamask.allTokens ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
    (state: MetaMaskAssetsControllerState) =>
      state.metamask.assetsBalance ?? {},
    (state: { metamask: AccountsControllerState }) =>
      state.metamask.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    allTokens,
    assetsInfo,
    assetsBalance,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return allTokens;
    }

    const result: TokensControllerState['allTokens'] = {};

    for (const [accountId, accountBalances] of Object.entries(assetsBalance)) {
      const internalAccount = internalAccountsById[accountId];
      if (!internalAccount || !isEvmAccountType(internalAccount.type)) {
        continue;
      }

      for (const assetId of Object.keys(accountBalances)) {
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

    for (const [accountId, account] of Object.entries(internalAccountsById)) {
      if (!isEvmAccountType(account.type)) {
        continue;
      }

      const checksummedAddress = toChecksumHexAddress(account.address) as Hex;
      result[checksummedAddress] = {};
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
