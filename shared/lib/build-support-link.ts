export type SupportLinkUserData = {
  version: string;
  profileId?: string;
  canonicalProfileId?: string;
  analyticsId?: string;
  shieldCustomerId?: string;
};

/**
 * Builds a MetaMask support URL with optional user-identifying query parameters.
 *
 * @param supportLink - Base support URL from environment configuration.
 * @param userData - Optional user data to append as query parameters.
 * @param userData.version
 * @param userData.profileId
 * @param userData.canonicalProfileId
 * @param userData.analyticsId
 * @param userData.shieldCustomerId
 * @returns Support URL with appended query parameters.
 */
export function buildSupportLinkWithUserData(
  supportLink: string,
  {
    version,
    profileId,
    canonicalProfileId,
    analyticsId,
    shieldCustomerId,
  }: SupportLinkUserData,
): string {
  const url = new URL(supportLink);
  url.searchParams.append('metamask_version', version);
  if (profileId) {
    url.searchParams.append('metamask_profile_id', profileId);
  }
  if (canonicalProfileId) {
    url.searchParams.append(
      'metamask_canonical_profile_id',
      canonicalProfileId,
    );
  }
  if (analyticsId) {
    url.searchParams.append('metamask_metametrics_id', analyticsId);
  }
  if (shieldCustomerId) {
    url.searchParams.append('shield_id', shieldCustomerId);
  }
  return url.toString();
}
