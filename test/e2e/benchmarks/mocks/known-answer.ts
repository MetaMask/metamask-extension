/**
 * Known-answer delays: a fixed extra delay on one mocked response, so a check
 * can confirm the step waiting on it grows by exactly that much. Each response
 * has its own environment variable, read at registration; unset or empty is 0.
 */

/** Delays the quote responses `fetchAndDisplaySwapQuotes` waits on. */
export const KNOWN_ANSWER_QUOTE_DELAY = 'BENCHMARK_KNOWN_ANSWER_QUOTE_DELAY_MS';

/**
 * Delays the Solana `getLatestBlockhash` response, which the review step
 * (`reviewTransactionToConfirmationPage`) waits on before the confirmation.
 */
export const KNOWN_ANSWER_SOLANA_BLOCKHASH_DELAY =
  'BENCHMARK_KNOWN_ANSWER_SOLANA_BLOCKHASH_DELAY_MS';

/**
 * Delays the bridge token-search response, which `bridge_search_token` waits
 * on before the matching row.
 */
export const KNOWN_ANSWER_TOKEN_SEARCH_DELAY =
  'BENCHMARK_KNOWN_ANSWER_TOKEN_SEARCH_DELAY_MS';

/**
 * Delays the v3 historical-prices response, which the asset page's price chart
 * needs before it renders `asset-price-percent-change`.
 */
export const KNOWN_ANSWER_HISTORICAL_PRICES_DELAY =
  'BENCHMARK_KNOWN_ANSWER_HISTORICAL_PRICES_DELAY_MS';

/**
 * Read a known-answer delay.
 * @param name - The environment variable that holds it.
 * @returns The delay in milliseconds, or 0 when unset or empty.
 */
export function getKnownAnswerDelayMs(name: string): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return 0;
  }
  const delayMs = Number(raw);
  if (!Number.isInteger(delayMs) || delayMs < 0) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  }
  return delayMs;
}

/**
 * Delay a mock's response by the known-answer delay. Wrap the fixture's handler
 * from outside, as in `withKnownAnswerDelay(name, delayedResponse(...))`, so
 * the delay still applies when the fixture's own delays are zeroed.
 */
export function withKnownAnswerDelay<TRequest, TResponse>(
  name: string,
  handler: (request: TRequest) => TResponse | Promise<TResponse>,
): (request: TRequest) => Promise<TResponse> {
  const delayMs = getKnownAnswerDelayMs(name);
  return async (request) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return handler(request);
  };
}
