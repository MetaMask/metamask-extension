/**
 * Extracts native XLM base reserve from balance enrichment extra.
 *
 * @param extra - Per-asset snap enrichment on the balance row.
 * @returns Display-unit base reserve string, or undefined when absent/invalid.
 */
export function getBaseReserveFromExtra(
  extra: { baseReserve?: string } | undefined,
): string | undefined {
  const value = extra?.baseReserve;
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return value;
}
