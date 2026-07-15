export type SupportLinkUserData = {
  version: string;
  customerServiceToken?: string;
  shieldCustomerId?: string;
};

/**
 * Builds a MetaMask support URL with support metadata.
 *
 * @param supportLink - Base support URL from environment configuration.
 * @param userData - Support metadata to append as query parameters. `version` is required;
 * other fields are included only when provided.
 * @param userData.version
 * @param userData.customerServiceToken
 * @param userData.shieldCustomerId
 * @returns Support URL with appended query parameters.
 */
export function buildSupportLinkWithUserData(
  supportLink: string,
  {
    version,
    customerServiceToken,
    shieldCustomerId,
  }: SupportLinkUserData,
): string {
  const url = new URL(supportLink);
  url.searchParams.append('metamask_version', version);
  if (customerServiceToken) {
    url.searchParams.append('customer_service_token', customerServiceToken);
  }
  if (shieldCustomerId) {
    url.searchParams.append('shield_id', shieldCustomerId);
  }
  return url.toString();
}
