/**
 * UTM params forwarded from a perps deeplink onto the destination route so the
 * client can attribute the screen views for the deeplink-entered session.
 */
const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/**
 * Build the destination query for a perps deeplink while preserving attribution.
 *
 * The perps deeplink handlers navigate to fresh in-app routes; without this the
 * `source=deeplink` marker and incoming `utm_*` params are dropped, so
 * PerpsAttributionProvider (which reads `location.search`) never sees them and
 * the whole deeplink/UTM attribution path is a dead end. This marks the entry
 * as a deeplink (`source=deeplink`, matching the value the provider maps) and
 * forwards any incoming `utm_*` params.
 *
 * @param source - The incoming deeplink query params.
 * @param query - An existing destination query to augment (defaults to empty).
 * @returns The destination query including attribution params.
 */
export function withDeeplinkAttribution(
  source: URLSearchParams,
  query: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  query.set('source', 'deeplink');
  for (const key of UTM_PARAMS) {
    const value = source.get(key);
    if (value) {
      query.set(key, value);
    }
  }
  return query;
}
