import { Env } from "@metamask/subscription-controller"

export type ShieldEnvConfig = {
  subscriptionEnv: Env;
  gatewayUrl: string;
  ruleEngineUrl: string;
  claimUrl: string;
}
