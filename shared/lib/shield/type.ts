import { Env } from '@metamask/subscription-controller';
import { Env as ClaimsEnv } from '@metamask/claims-controller';
import { Env as ShieldEnv } from '@metamask/shield-controller';

export type ShieldEnvConfig = {
  subscriptionEnv: Env;
  claimsEnv: ClaimsEnv;
  shieldEnv: ShieldEnv;
  gatewayUrl: string;
};

export type ShieldSubscriptionError = {
  message: string;
  code?: string;
};
