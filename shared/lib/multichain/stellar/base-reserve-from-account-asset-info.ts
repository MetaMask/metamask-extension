/**
 * Extracts native XLM base reserve from accountAssetInfo.
 *
 * @param accountAssetInfo - Per-asset enrichment on the balance row.
 * @returns Display-unit base reserve string, or undefined when absent/invalid.
 */
export function getBaseReserveFromAccountAssetInfo(
  accountAssetInfo: { baseReserve?: string } | undefined,
): string | undefined {
  const value = accountAssetInfo?.baseReserve;
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return value;
}
