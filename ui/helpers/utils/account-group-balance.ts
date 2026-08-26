/**
 * Shape of an aggregated account group balance, as produced by
 * `selectBalanceForAllWallets`.
 */
type AccountGroupBalanceLike = {
  totalBalanceInUserCurrency?: number;
  userCurrency?: string;
};

/**
 * An account group balance that is known and worth rendering.
 */
type DisplayableAccountGroupBalance = {
  amount: number;
  currency: string;
};

/**
 * Returns an account group's aggregated balance when it should be rendered in
 * an account cell, and `undefined` when nothing should be rendered.
 *
 * Balances are only fetched eagerly for the selected account group — for
 * performance, the rest are filled in lazily. An account group whose balance has
 * not been fetched yet aggregates to `0`, exactly like a genuinely empty one, so
 * the two are indistinguishable from the aggregated state. Showing "$0.00" for
 * both makes users believe their funds are gone, so we render nothing until a
 * non-zero balance is known. This mirrors `AccountCell` on mobile.
 *
 * Formatting is left to the call site, which already has a currency formatter.
 *
 * @param groupBalance - The account group's aggregated balance, if present.
 * @returns The amount and currency to format, or `undefined` when nothing
 * should be rendered.
 */
export function getAccountGroupDisplayBalance(
  groupBalance: AccountGroupBalanceLike | undefined,
): DisplayableAccountGroupBalance | undefined {
  const { totalBalanceInUserCurrency: amount, userCurrency: currency } =
    groupBalance ?? {};

  if (!amount || !currency) {
    return undefined;
  }

  return { amount, currency };
}
