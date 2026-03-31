const STORAGE_KEY = 'perps-last-leverage';
const DEFAULT_LEVERAGE = 3;

type LeverageRecord = Record<string, number>;

function readLeverageMap(): LeverageRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as LeverageRecord;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Get the last leverage used for a given market symbol.
 * Returns the stored value, or `DEFAULT_LEVERAGE` (3x) if no history exists.
 *
 * @param symbol - Market symbol (e.g. 'BTC', 'ETH')
 * @returns Last leverage used, or 3 for first-time users
 */
export function getLastLeverage(symbol: string): number {
  const map = readLeverageMap();
  const key = symbol.toUpperCase();
  return map[key] ?? DEFAULT_LEVERAGE;
}

/**
 * Persist the leverage a user chose for a given market symbol.
 *
 * @param symbol - Market symbol
 * @param leverage - Leverage value to remember
 */
export function saveLastLeverage(symbol: string, leverage: number): void {
  const map = readLeverageMap();
  map[symbol.toUpperCase()] = leverage;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full or unavailable – silently ignore
  }
}
