/**
 * Switch that selects which identity backend env the extension talks to.
 *
 * Set `MM_DEV_API_ENV=dev` in `.metamaskrc` to point AuthenticationController
 * and identity services that read `loadAuthenticationConfig()` at DEV backends.
 * Defaults to prod when unset or unrecognized.
 *
 * Read synchronously at call time — no Redux, no remote flag. Each consumer
 * reads the same source independently.
 *
 * Disclaimer: Enabling DEV will break authenticated services that have not
 * adopted DEV backends (notifications, shield, money-account, bridge, perps).
 */
export type DevApiEnv = 'dev' | 'prod';

export function devApiEnv(): DevApiEnv {
  const raw = (process.env.MM_DEV_API_ENV ?? '').toLowerCase();
  return raw === 'dev' ? 'dev' : 'prod';
}
