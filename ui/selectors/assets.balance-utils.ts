import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import {
  getAggregatedBalanceForAccount,
  type AccountsById,
  type AssetsControllerState,
  type EnabledNetworkMap,
} from '@metamask/assets-controller';
import type {
  AllWalletsBalance,
  BalanceChangePeriod,
  BalanceChangeResult,
  WalletBalance,
} from '@metamask/assets-controllers';

// TODO: move this module into `@metamask/assets-controller`.
function getAccountIdsForGroup(
  accountTreeState: AccountTreeControllerState,
  groupId: string,
): string[] {
  const wallets = accountTreeState.accountTree?.wallets ?? {};
  for (const wallet of Object.values(wallets)) {
    const group = wallet?.groups?.[groupId as keyof typeof wallet.groups];
    if (group?.accounts) {
      return [...group.accounts];
    }
  }
  return [];
}

function aggregateGroupBalance(
  assetsControllerState: AssetsControllerState,
  accountsById: AccountsById,
  enabledNetworkMap: EnabledNetworkMap,
  accountIds: string[],
): { totalBalanceInFiat: number; pricePercentChange1d: number } {
  if (accountIds.length === 0) {
    return { totalBalanceInFiat: 0, pricePercentChange1d: 0 };
  }
  // `getAggregatedBalanceForAccount` resolves the accounts from the explicit
  // id list (`accountIds`), so the `selectedInternalAccount` argument is only a
  // placeholder here and is never used for resolution.
  // TODO - we can probably tweak to remove the idea of "selectedInternalAccount" as this makes the balance calculation brittle
  const placeholderAccount = accountsById[accountIds[0]] ?? {
    id: accountIds[0],
  };
  // Do not pass the optional `trace` callback. This runs inside a Redux
  // selector that recomputes per account group on every state change, so
  // tracing it emits an unbounded number of transaction roots (#44447).
  const { totalBalanceInFiat = 0, pricePercentChange1d = 0 } =
    getAggregatedBalanceForAccount(
      assetsControllerState,
      placeholderAccount,
      enabledNetworkMap,
      undefined,
      accountIds,
      accountsById,
    );
  return { totalBalanceInFiat, pricePercentChange1d };
}

function getCurrentAndPrevious(
  totalBalanceInFiat: number,
  pricePercentChange1d: number,
  period: BalanceChangePeriod,
): { current: number; previous: number } {
  const DEFAULT_VALUE = { current: 0, previous: 0 } as const;
  const percentRaw = period === '1d' ? pricePercentChange1d : 0;

  const denom = Number((1 + percentRaw / 100).toFixed(8));
  if (denom === 0) {
    return DEFAULT_VALUE;
  }

  const current = totalBalanceInFiat;
  const previous = current / denom;
  return { current, previous };
}

function buildBalanceChangeResult(
  current: number,
  previous: number,
  period: BalanceChangePeriod,
  userCurrency: string,
): BalanceChangeResult {
  const amountChange = current - previous;
  const percentChange = previous === 0 ? 0 : (amountChange / previous) * 100;
  return {
    period,
    currentTotalInUserCurrency: Number(current.toFixed(8)),
    previousTotalInUserCurrency: Number(previous.toFixed(8)),
    amountChangeInUserCurrency: Number(amountChange.toFixed(8)),
    percentChange: Number(percentChange.toFixed(8)),
    userCurrency,
  };
}

/**
 * Calculate aggregated balances for all wallets and groups.
 *
 * Mirrors the legacy `calculateBalanceForAllWallets` output, but sources every
 * group total from the new per-account `getAggregatedBalanceForAccount`
 * selector. Because the new selector only exposes per-account/per-group
 * aggregation, the "all wallets" scenario is polyfilled by walking the account
 * tree and aggregating each group individually.
 *
 * @param assetsControllerState - Minimal AssetsController state slice.
 * @param accountTreeState - AccountTreeController state.
 * @param accountsById - Internal accounts keyed by account id.
 * @param enabledNetworkMap - Map of enabled networks keyed by namespace.
 * @returns Aggregated balances for all wallets and groups.
 */
export function calculateBalanceForAllWallets(
  assetsControllerState: AssetsControllerState,
  accountTreeState: AccountTreeControllerState,
  accountsById: AccountsById,
  enabledNetworkMap: EnabledNetworkMap,
): AllWalletsBalance {
  const userCurrency = assetsControllerState.selectedCurrency ?? 'usd';
  const wallets: AllWalletsBalance['wallets'] = {};
  let totalBalanceInUserCurrency = 0;

  for (const [walletId, wallet] of Object.entries(
    accountTreeState.accountTree?.wallets ?? {},
  )) {
    const walletBalance: WalletBalance = {
      walletId,
      groups: {},
      totalBalanceInUserCurrency: 0,
      userCurrency,
    };

    for (const groupId of Object.keys(wallet?.groups ?? {})) {
      const accountIds = getAccountIdsForGroup(accountTreeState, groupId);
      const { totalBalanceInFiat } = aggregateGroupBalance(
        assetsControllerState,
        accountsById,
        enabledNetworkMap,
        accountIds,
      );

      walletBalance.groups[groupId] = {
        walletId,
        groupId,
        totalBalanceInUserCurrency: totalBalanceInFiat,
        userCurrency,
      };
      walletBalance.totalBalanceInUserCurrency += totalBalanceInFiat;
    }

    wallets[walletId] = walletBalance;
    totalBalanceInUserCurrency += walletBalance.totalBalanceInUserCurrency;
  }

  return { wallets, totalBalanceInUserCurrency, userCurrency };
}

export function calculateBalanceChangeForAccountGroup(
  assetsControllerState: AssetsControllerState,
  accountTreeState: AccountTreeControllerState,
  accountsById: AccountsById,
  enabledNetworkMap: EnabledNetworkMap,
  groupId: string,
  period: BalanceChangePeriod,
): BalanceChangeResult {
  const userCurrency = assetsControllerState.selectedCurrency ?? 'usd';
  const accountIds = getAccountIdsForGroup(accountTreeState, groupId);
  const { totalBalanceInFiat, pricePercentChange1d } = aggregateGroupBalance(
    assetsControllerState,
    accountsById,
    enabledNetworkMap,
    accountIds,
  );

  const { current, previous } = getCurrentAndPrevious(
    totalBalanceInFiat,
    pricePercentChange1d,
    period,
  );

  return buildBalanceChangeResult(current, previous, period, userCurrency);
}
