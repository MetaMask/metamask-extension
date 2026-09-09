import { ConfigRegistryApiEnv } from '@metamask/config-registry-controller';
import type { WalletOptions } from '@metamask/wallet';

type ConfigRegistryApiServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['configRegistryApiService']
>;

const BUILD_TYPE_TO_ENV: Record<string, ConfigRegistryApiEnv> = {
  beta: ConfigRegistryApiEnv.UAT,
  uat: ConfigRegistryApiEnv.UAT,
};

/**
 * Builds the service options required by the wallet-owned ConfigRegistryApiService.
 *
 * @returns The ConfigRegistryApiService instance options.
 */
export function getConfigRegistryApiServiceInstanceOptions(): ConfigRegistryApiServiceInstanceOptions {
  const buildType = process.env.METAMASK_BUILD_TYPE ?? '';
  const env = BUILD_TYPE_TO_ENV[buildType] ?? ConfigRegistryApiEnv.PRD;

  return { env, fetch: fetch.bind(globalThis) };
}
