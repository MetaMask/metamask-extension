import { calcTokenAmount } from '../transactions-controller-utils';

type AssetMetadataEntry = {
  units?: { decimals?: number }[];
};

/**
 * Converts a multichain balance amount from smallest-unit integers to a
 * human-readable numeric value when asset metadata decimals are available.
 *
 * Snaps typically return human-readable decimal strings (e.g. Tron `"6.07"`).
 * Some snaps (e.g. Stellar preview) may return integer smallest-unit strings
 * (e.g. stroops `"60723920"`). This helper detects integer strings and applies
 * metadata decimals; decimal strings are returned unchanged.
 *
 * @param amount - Raw balance amount string from multichain balances state.
 * @param assetId - CAIP asset identifier used to look up metadata decimals.
 * @param assetsMetadata - Assets metadata keyed by CAIP asset id.
 * @returns Human-readable balance as a number.
 */
export function getMultichainBalanceDisplayAmount(
  amount: string,
  assetId: string,
  assetsMetadata: Record<string, AssetMetadataEntry>,
): number {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return 0;
  }

  const decimals = assetsMetadata[assetId]?.units?.[0]?.decimals ?? 0;
  if (decimals === 0) {
    return numericAmount;
  }

  const isLikelySmallestUnit = !amount.includes('.');
  if (!isLikelySmallestUnit) {
    return numericAmount;
  }

  return calcTokenAmount(amount, decimals).toNumber();
}

type MultichainBalanceEntry = {
  amount: string;
  unit: string;
};

/**
 * Converts multichain balance amounts from smallest-unit integers to
 * human-readable values for display selectors.
 *
 * @param balances - Multichain balances keyed by account id and asset id.
 * @param assetsMetadata - Assets metadata keyed by CAIP asset id.
 * @returns Balances with display-ready amount strings.
 */
export function transformMultichainBalancesForDisplay(
  balances: Record<string, Record<string, MultichainBalanceEntry>> | undefined,
  assetsMetadata: Record<string, AssetMetadataEntry>,
): Record<string, Record<string, MultichainBalanceEntry>> {
  if (!balances || typeof balances !== 'object' || Array.isArray(balances)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(balances ?? {}).map(([accountId, accountBalances]) => [
      accountId,
      Object.fromEntries(
        Object.entries(accountBalances ?? {}).map(([assetId, balance]) => [
          assetId,
          {
            ...balance,
            amount: String(
              getMultichainBalanceDisplayAmount(
                balance.amount,
                assetId,
                assetsMetadata,
              ),
            ),
          },
        ]),
      ),
    ]),
  );
}
