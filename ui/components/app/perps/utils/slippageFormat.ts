// Format the combined slippage row value matching mobile's
// `perps.slippage.row_format`: "Est: x% / Max: y%"
// When estimate is pending: "Est: -- / Max: y%"
export function formatSlippageRowValue(
  estimatedPct: number | null,
  maxSlippagePct: number,
  insufficientLiquidity: boolean,
): string {
  const maxStr = `${maxSlippagePct.toFixed(1)}%`;
  if (insufficientLiquidity) {
    return `Est: >max / Max: ${maxStr}`;
  }
  if (estimatedPct === null) {
    return `Est: -- / Max: ${maxStr}`;
  }
  return `Est: ${estimatedPct.toFixed(2)}% / Max: ${maxStr}`;
}

export function formatMaxSlippagePct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
