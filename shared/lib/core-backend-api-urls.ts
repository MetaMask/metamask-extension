/**
 * Overrides for the `@metamask/core-backend` API platform base URLs, driven by
 * build env vars (see `builds.yml` / `.metamaskrc.dist`). This mirrors
 * `MM_BACKEND_WEBSOCKET_URL` for the Backend WebSocket service: each REST
 * service URL can be pointed at a dev/local backend without code changes.
 */

/**
 * Resolve the `apiUrls` option for `createApiPlatformClient` from env vars.
 * Returned as a spreadable partial options object so call sites stay
 * compatible with `@metamask/core-backend` versions that predate the
 * `apiUrls` option (the override only takes effect once the dependency
 * supports it).
 *
 * @returns An object with `apiUrls` when at least one env override is set,
 * otherwise an empty object (production defaults apply).
 */
export function getBackendApiUrlsOption(): {
  apiUrls?: Record<string, string>;
} {
  const overrides: Record<string, string> = {
    ...(process.env.MM_BACKEND_ACCOUNTS_API_URL
      ? { ACCOUNTS: process.env.MM_BACKEND_ACCOUNTS_API_URL }
      : {}),
    ...(process.env.MM_BACKEND_PRICES_API_URL
      ? { PRICES: process.env.MM_BACKEND_PRICES_API_URL }
      : {}),
    ...(process.env.MM_BACKEND_TOKEN_API_URL
      ? { TOKEN: process.env.MM_BACKEND_TOKEN_API_URL }
      : {}),
    ...(process.env.MM_BACKEND_TOKENS_API_URL
      ? { TOKENS: process.env.MM_BACKEND_TOKENS_API_URL }
      : {}),
  };
  return Object.keys(overrides).length > 0 ? { apiUrls: overrides } : {};
}
