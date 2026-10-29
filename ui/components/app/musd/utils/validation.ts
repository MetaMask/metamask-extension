/**
 * MUSD Validation Utilities
 *
 * Geo-blocking checks for mUSD conversion access.
 */

/**
 * Check if a user's country/region is blocked from accessing mUSD conversion.
 * Uses startsWith matching to support country-region codes (e.g., "GB-ENG").
 *
 * IMPORTANT: Blocks by default when country is unknown/empty for compliance safety.
 *
 * @param userCountry - User's country/region code (e.g., "US", "GB", "US-CA")
 * @param blockedRegions - Array of blocked region codes
 * @returns true if the user is in a blocked region
 */
export function isGeoBlocked(
  userCountry: string | undefined | null,
  blockedRegions: string[],
): boolean {
  // Block by default if country is unknown (fail closed for compliance)
  if (!userCountry || userCountry.trim() === '') {
    return true;
  }

  const normalizedCountry = userCountry.toUpperCase().trim();

  for (const blockedRegion of blockedRegions) {
    const normalizedBlockedRegion = blockedRegion.toUpperCase().trim();

    // Exact match
    if (normalizedCountry === normalizedBlockedRegion) {
      return true;
    }

    // startsWith match for country codes (GB blocks GB-ENG, GB-SCT, etc.)
    // But US-NY should not match US
    if (
      normalizedBlockedRegion.length <= 2 &&
      normalizedCountry.startsWith(`${normalizedBlockedRegion}-`)
    ) {
      return true;
    }
  }

  return false;
}
