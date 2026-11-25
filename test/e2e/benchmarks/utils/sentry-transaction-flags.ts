// origin: ai-synthesis
import type { ManifestFlags } from '../../../../shared/lib/manifestFlags';

/**
 * Flags for a flow that reads `Sentry` transactions from the mock. `forceEnable`
 * bypasses the fixtures' MetaMetrics opt-out and needs `ci`, which CI overwrites.
 * @returns A fresh object: `setManifestFlags` mutates its argument.
 */
export function getSentryTransactionManifestFlags(): ManifestFlags {
  return {
    ci: { enabled: true },
    sentry: { tracesSampleRate: 1, forceEnable: true },
  };
}
