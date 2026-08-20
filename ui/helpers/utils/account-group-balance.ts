/**
 * Shape of an aggregated account group balance, as produced by
 * `selectBalanceForAllWallets`.
 */
type AccountGroupBalanceLike = {
  totalBalanceInUserCurrency?: number;
  userCurrency?: string;
};

/**
 * Formats an account group's aggregated balance for display in an account cell,
 * returning `undefined` when nothing should be rendered.
 *
 * Balances are only fetched eagerly for the selected account group — for
 * performance, the rest are filled in lazily. An account group whose balance has
 * not been fetched yet aggregates to `0`, exactly like a genuinely empty one, so
 * the two are indistinguishable from the aggregated state. Showing "$0.00" for
 * both makes users believe their funds are gone, so we render nothing until a
 * non-zero balance is known. This mirrors `AccountCell` on mobile.
 *
 * @param groupBalance - The account group's aggregated balance, if present.
 * @param formatCurrency - Currency formatter, e.g. `formatCurrencyWithMinThreshold`.
 * @returns The formatted balance, or `undefined` when it should not be rendered.
 */
export function getAccountGroupDisplayBalance(
  groupBalance: AccountGroupBalanceLike | undefined,
  formatCurrency: (value: number, currency: string) => string,
): string | undefined {
  const total = groupBalance?.totalBalanceInUserCurrency;
  const currency = groupBalance?.userCurrency;

  if (!total || !currency) {
    return undefined;
  }

  return formatCurrency(total, currency);
}
