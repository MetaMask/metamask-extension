/**
 * [BNES] H1.2 — Background install helper for the internal BNS resolver.
 *
 * Minimal surface for background.js: setup once, then getBnsResolver() for
 * internal callers. webRequest redirect is a separate install (H1.5
 * setupBnsWebRequestRedirect) and never renders remote content inside the
 * extension origin.
 */

import type { BnsConfigSources } from '../../../../shared/bns/config';
import { BNS_SEED_REGISTRY_ADDRESS } from '../../../../shared/bns/constants';
import {
  createBnsResolver,
  type BnsResolverApi,
  type CreateBnsResolverOptions,
} from './create-bns-resolver';

let activeResolver: BnsResolverApi | null = null;

export type SetupBnsResolverOptions = CreateBnsResolverOptions & {
  /**
   * When true (default), bind the instance for getBnsResolver().
   * Tests may pass false to avoid cross-test leakage when desired.
   */
  activate?: boolean;
};

/**
 * Install the BNS resolver API used by background and internal tools.
 *
 * @param options - Config sources and injectors.
 * @returns Active resolver API.
 */
export function setupBnsResolver(
  options: SetupBnsResolverOptions = {},
): BnsResolverApi {
  const getConfigSources = (): BnsConfigSources => {
    const fromCaller = options.getConfigSources?.() ?? {};
    return {
      registryAddress:
        fromCaller.registryAddress ??
        options.configSources?.registryAddress ??
        BNS_SEED_REGISTRY_ADDRESS,
      gatewayHost:
        fromCaller.gatewayHost ?? options.configSources?.gatewayHost,
      rpcUrls: fromCaller.rpcUrls ?? options.configSources?.rpcUrls,
      timeoutMs: fromCaller.timeoutMs ?? options.configSources?.timeoutMs,
    };
  };

  const resolver = createBnsResolver({
    ...options,
    getConfigSources,
  });

  if (options.activate !== false) {
    activeResolver = resolver;
  }

  return resolver;
}

/**
 * Return the resolver installed by setupBnsResolver, if any.
 *
 * @returns Active API or null.
 */
export function getBnsResolver(): BnsResolverApi | null {
  return activeResolver;
}

/**
 * Clear the active resolver (tests / shutdown).
 */
export function resetBnsResolverForTests(): void {
  activeResolver = null;
}
