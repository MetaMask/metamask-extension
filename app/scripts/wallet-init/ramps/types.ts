import type { CreateServicePolicyOptions } from '@metamask/controller-utils';
import type { RampsEnvironment } from '@metamask/ramps-controller';

export type RampsServiceInstanceOptions = {
  environment?: RampsEnvironment;
  context: string;
  fetch: typeof fetch;
  policyOptions?: CreateServicePolicyOptions;
  baseUrlOverride?: string;
};

export type RampsControllerInstanceOptions = {
  requestCacheTTL?: number;
  requestCacheMaxSize?: number;
};
