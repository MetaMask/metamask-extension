/**
 * Case-insensitive check whether a provider supports a given asset.
 * Provider `supportedCryptoCurrencies` keys are lowercase (from API),
 * but token assetIds may be checksummed (mixed case).
 *
 * @param provider - Provider with optional supported crypto map.
 * @param provider.supportedCryptoCurrencies
 * @param assetId - Asset id to check.
 * @returns True when the provider lists the asset as supported.
 */
export function providerSupportsAsset(
  provider: { supportedCryptoCurrencies?: Record<string, boolean> },
  assetId: string | null | undefined,
): boolean {
  const map = provider.supportedCryptoCurrencies;
  if (!map || typeof assetId !== 'string' || assetId.length === 0) {
    return false;
  }
  return map[assetId] === true || map[assetId.toLowerCase()] === true;
}
