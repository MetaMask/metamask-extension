import type { WalletOptions } from '@metamask/wallet';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';

type SubscriptionServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['subscriptionService']
>;

/**
 * Builds the service options required by the wallet-owned `SubscriptionService`.
 *
 * @returns The SubscriptionService instance options.
 */
export function getSubscriptionServiceInstanceOptions(): SubscriptionServiceInstanceOptions {
  const { subscriptionEnv } = loadShieldConfig();

  return {
    env: subscriptionEnv,
    captureException,
  };
}
