import type { WalletOptions } from '@metamask/wallet';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException } from '../../../../shared/lib/sentry';

type SubscriptionServiceInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['subscriptionService']
>;

export function getSubscriptionServiceInstanceOptions(): SubscriptionServiceInstanceOptions {
  const { subscriptionEnv } = loadShieldConfig();

  return {
    env: subscriptionEnv,
    fetchFunction: fetch.bind(globalThis),
    captureException,
  };
}
