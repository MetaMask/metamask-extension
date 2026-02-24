import { Env } from '@metamask/subscription-controller';
import { Env as ClaimsEnv } from '@metamask/claims-controller';

export type ShieldEnvConfig = {
  subscriptionEnv: Env;
  claimsEnv: ClaimsEnv;
  gatewayUrl: string;
  ruleEngineUrl: string;
};

export type ShieldSubscriptionError = {
  message: string;
  code?: string;
};
