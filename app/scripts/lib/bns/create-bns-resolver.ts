/**
 * [BNES] H1.2 — Factory wiring ethCall quorum + resolveBnesContent.
 *
 * Lives under app/scripts/lib/bns/ so background can call it without pulling
 * UI code. Pure shared logic remains in shared/bns/.
 */

import {
  isBnsRegistryConfigured,
  resolveBnsRuntimeConfig,
} from '../../../../shared/bns/config';
import type { BnsConfigSources, BnsRuntimeConfig } from '../../../../shared/bns/config';
import {
  ethCallWithQuorum,
} from '../../../../shared/bns/quorum';
import type { QuorumFetch } from '../../../../shared/bns/quorum';
import {
  resolveBnesContent,
} from '../../../../shared/bns/resolve';
import type {
  BnsEthCall,
  ResolveBnesContentResult,
} from '../../../../shared/bns/resolve';

export type CreateBnsResolverOptions = {
  /** Static or partially filled config sources (fail-closed on resolve). */
  configSources?: BnsConfigSources;
  /** Optional getter re-read on each resolve (env / preferences). */
  getConfigSources?: () => BnsConfigSources;
  /** Injectable eth_call (tests). Defaults to 3-of-2 quorum fetch. */
  ethCall?: BnsEthCall;
  fetchImpl?: QuorumFetch;
};

export type BnsResolverApi = {
  /**
   * Whether a non-zero registry is currently configured (does not throw).
   */
  isConfigured: () => boolean;
  /**
   * Validate and return runtime config, or throw fail-closed errors.
   */
  getConfig: () => BnsRuntimeConfig;
  /**
   * Resolve a .bnes name to a trusted gateway URL via contenthash.
   */
  resolve: (name: string, path?: string) => Promise<ResolveBnesContentResult>;
};

/**
 * Create an internal BNS resolver API for MetaMask background use.
 *
 * @param options - Config sources and optional eth_call / fetch injectors.
 * @returns Resolver API.
 */
export function createBnsResolver(
  options: CreateBnsResolverOptions = {},
): BnsResolverApi {
  const readSources = (): BnsConfigSources => ({
    ...(options.configSources ?? {}),
    ...(options.getConfigSources?.() ?? {}),
  });

  const isConfigured = (): boolean => {
    const sources = readSources();
    return isBnsRegistryConfigured(sources.registryAddress);
  };

  const getConfig = (): BnsRuntimeConfig => {
    return resolveBnsRuntimeConfig(readSources());
  };

  const resolve = async (
    name: string,
    path = '',
  ): Promise<ResolveBnesContentResult> => {
    const config = getConfig();
    const ethCall: BnsEthCall =
      options.ethCall ??
      ((request) =>
        ethCallWithQuorum(request, {
          rpcUrls: config.rpcUrls,
          timeoutMs: config.timeoutMs,
          fetchImpl: options.fetchImpl,
        }));

    return resolveBnesContent({
      name,
      registryAddress: config.registryAddress,
      gatewayHost: config.gatewayHost,
      path,
      ethCall,
    });
  };

  return {
    isConfigured,
    getConfig,
    resolve,
  };
}
