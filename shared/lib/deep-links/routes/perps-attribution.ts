const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

const UTM_VALUE_PATTERN = /^[A-Za-z0-9._~-]{1,128}$/u;

/**
 * Adds validated campaign attribution from canonical deeplink parameters.
 *
 * @param source - Canonical parameters supplied by the deeplink parser.
 * @param query - Destination parameters to augment.
 * @returns The destination query with validated attribution.
 */
export function withDeeplinkAttribution(
  source: URLSearchParams,
  query: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  query.set('source', 'deeplink');

  for (const key of UTM_PARAMS) {
    const values = source.getAll(key);
    if (values.length === 1 && UTM_VALUE_PATTERN.test(values[0])) {
      query.set(key, values[0]);
    }
  }

  return query;
}
