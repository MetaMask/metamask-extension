import { Env } from '@metamask/subscription-controller';
import { Env as ClaimsEnv } from '@metamask/claims-controller';

/**
 * Shield gateway / API environments use the same `dev` | `uat` | `prd` values as
 * subscription-controller. `Env` was removed from `@metamask/shield-controller`,
 * so we reuse the subscription enum for typing.
 */
export type ShieldEnvConfig = {
  subscriptionEnv: Env;
  claimsEnv: ClaimsEnv;
  shieldEnv: Env;
  gatewayUrl: string;
};

export type ShieldSubscriptionError = {
  message: string;
  code?: string;
};
