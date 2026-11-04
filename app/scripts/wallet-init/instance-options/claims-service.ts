import type { WalletOptions } from '@metamask/wallet';
import { loadShieldConfig } from '../../../../shared/lib/shield/config';

type ClaimsServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['claimsService']
>;

/**
 * Builds the service options required by the wallet-owned ClaimsController.
 *
 * @returns The ClaimsService instance options.
 */
export function getClaimsServiceInstanceOptions(): ClaimsServiceInstanceOptions {
  const { claimsEnv } = loadShieldConfig();

  return {
    env: claimsEnv,
    // Same service-worker fetch binding as SubscriptionService. ClaimsService
    // invokes fetch with the service as `this`.
    fetchFunction: globalThis.fetch.bind(globalThis),
  };
}
