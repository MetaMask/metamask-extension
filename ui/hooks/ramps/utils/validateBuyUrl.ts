/**
 * Guards the provider buy-widget fetch against malformed quote `buyURL`s
 * (TRAM-3947): the quotes API hands back a pre-built buy-widget URL, and a
 * mangled one (e.g. string-concatenated server-side with a bare `%` and a raw
 * newline) would otherwise be fetched verbatim and surface as a raw HTTP 400
 * in the buy flow.
 */

/**
 * The ramps API origins allowed to serve buy-widget URLs. Mirrors the Orders
 * base URLs in `@metamask/ramps-controller`'s `RampsService` (production,
 * staging, development, local — the orders API has no separate cache host).
 */
const RAMP_API_ORIGINS = [
  'https://on-ramp.api.cx.metamask.io',
  'https://on-ramp.uat-api.cx.metamask.io',
  'https://on-ramp.dev-api.cx.metamask.io',
  'http://localhost:3000',
] as const;

/**
 * Query params the buy-widget endpoints require. Only params the API always
 * sets are listed — `orderId` is deliberately absent because dummy-quote URLs
 * never carry it, and `fiatCurrencyId`/`amount` are not guaranteed across
 * provider flows.
 */
const REQUIRED_QUERY_PARAMS = [
  'regionId',
  'paymentMethodId',
  'cryptoCurrencyId',
  'walletAddress',
  'redirectUrl',
] as const;

// Detecting control characters is the purpose of this check.
// eslint-disable-next-line no-control-regex
const WHITESPACE_OR_CONTROL = /[\s\u0000-\u001f\u007f]/u;

const INVALID_PERCENT_ESCAPE = /%(?![0-9a-fA-F]{2})/u;

export type BuyWidgetUrlInvalidReason =
  | 'missing'
  | 'invalid-characters'
  | 'invalid-encoding'
  | 'unparseable'
  | 'untrusted-host'
  | 'missing-params';

export type BuyWidgetUrlValidationResult =
  | { isValid: true }
  | { isValid: false; reason: BuyWidgetUrlInvalidReason };

/**
 * Validates a quote's buy-widget URL before it is fetched.
 *
 * @param buyUrl - The raw `quote.quote.buyURL` string from the quotes API.
 * @returns `{ isValid: true }`, or `{ isValid: false, reason }` describing the
 * first problem found.
 */
export function validateBuyWidgetUrl(
  buyUrl: string | undefined | null,
): BuyWidgetUrlValidationResult {
  if (!buyUrl) {
    return { isValid: false, reason: 'missing' };
  }

  // A raw newline or control character means the URL was assembled by string
  // concatenation from a multi-line template — WHATWG URL parsing would strip
  // these silently and send a different URL than the quote advertised.
  if (WHITESPACE_OR_CONTROL.test(buyUrl)) {
    return { isValid: false, reason: 'invalid-characters' };
  }

  // A bare `%` (not part of a valid percent-escape) means the URL was mangled.
  if (INVALID_PERCENT_ESCAPE.test(buyUrl)) {
    return { isValid: false, reason: 'invalid-encoding' };
  }

  let parsed: URL;
  try {
    parsed = new URL(buyUrl);
  } catch {
    return { isValid: false, reason: 'unparseable' };
  }

  if (!(RAMP_API_ORIGINS as readonly string[]).includes(parsed.origin)) {
    return { isValid: false, reason: 'untrusted-host' };
  }

  const hasAllRequiredParams = REQUIRED_QUERY_PARAMS.every((param) => {
    const value = parsed.searchParams.get(param);
    return value !== null && value !== '';
  });
  if (!hasAllRequiredParams) {
    return { isValid: false, reason: 'missing-params' };
  }

  return { isValid: true };
}
