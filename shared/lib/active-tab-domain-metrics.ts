import { ACTIVE_TAB_DOMAIN_ALLOWLIST } from '../constants/metametrics';

/**
 * Returns the canonical HTTPS origin if its hostname is in the active-tab
 * domain allowlist, undefined otherwise.
 *
 * @param origin - The raw origin string from the active browser tab.
 */
export function getActiveTabDomainForMetrics(
  origin: string | undefined,
): string | undefined {
  if (!origin) {
    return undefined;
  }
  try {
    const { hostname } = new URL(origin);
    return ACTIVE_TAB_DOMAIN_ALLOWLIST.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`),
    )
      ? new URL(origin).origin
      : undefined;
  } catch {
    return undefined;
  }
}
